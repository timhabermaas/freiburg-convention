import { EventStore } from "../services/stores/interface";
import { Event, EventEnvelope } from "~/domain/events";
import { v4 as uuid } from "uuid";
import {
  Accommodation,
  Address,
  Cents,
  Day,
  Limits,
  Mail,
  PaidStatus,
  Participant,
  Registration,
  Ticket,
  TShirtSize,
} from "~/domain/types";
import { TICKETS } from "./tickets";
import { MailSender } from "~/services/email/interface";
import { formatCurrency } from "~/i18n";
import {
  assertNever,
  finalPriceModifier,
  formatTicket,
  paymentReasonForRegistrationCount,
  ticketPrice,
} from "~/utils";
import { ACCOMMODATIONS } from "./accommodation";
import AsyncLock from "async-lock";

interface State {
  latestVersion: number;
  registrationCount: number;
  participants: [string, Participant][];
  registrations: Registration[];
  payments: {
    paymentId: string;
    amountInCents: number;
    registrationId: string;
  }[];
  eventsPerRegistration: Map<string, EventEnvelope<Event>[]>;
  // Maps from registrationId to PaidStatus
  paidMap: Map<string, PaidStatus>;
  // Maps from the accommodation to Thu–Sun/Fri–Sun
  accommodationMap: Map<Accommodation, [number, number]>;
  limits: Limits;
  // Contains the registration date for each participant, ascending order
  registrationTimes: Date[];
}

const THURSDAY = new Day(2022, 5, 26);
const FRIDAY = new Day(2022, 5, 27);
const SUNDAY = new Day(2022, 5, 29);

function initState(): State {
  return {
    latestVersion: 0,
    registrationCount: 0,
    participants: [],
    registrations: [],
    payments: [],
    eventsPerRegistration: new Map(),
    accommodationMap: new Map(),
    paidMap: new Map(),
    limits: {
      total: 250,
      gym: 64,
      tent: 150,
    },
    registrationTimes: [],
  };
}

export class App {
  private eventStore: EventStore;
  private mailSender: MailSender;
  private state: State = initState();
  private lock: AsyncLock;

  constructor(eventStore: EventStore, mailSender: MailSender) {
    this.eventStore = eventStore;
    this.mailSender = mailSender;
    this.lock = new AsyncLock({ timeout: 5000 });

    setTimeout(() => {
      // Backup after startup, necessary for heroku and other cloud providers which don't keep the process running.
      this.eventStore.backup();

      // TODO: Clean up the interval at some point.
      setInterval(() => {
        this.eventStore.backup();
        // Backup every 6 hours
      }, 6 * 60 * 60 * 1000);
    }, 1000);
  }

  public reset() {
    this.state = initState();
    this.eventStore.clear();
  }

  public async replay(): Promise<void> {
    for (const event of await this.eventStore.readAll()) {
      this.apply(event);
    }
  }

  public async register(
    email: string,
    participants: {
      fullName: string;
      address: Address;
      ticketId: string;
      birthday: Day;
      accommodation: Accommodation;
      priceModifier?: "Supporter" | "Cheaper";
      tShirtSize?: TShirtSize;
    }[],
    comment: string
  ) {
    return this.lock.acquire("mutate", async () => {
      const persistedParticipants = participants.map((p) => {
        const ticket = this.findTicketOrThrow(p.ticketId);

        const pM =
          p.priceModifier === "Supporter"
            ? 1000
            : p.priceModifier === "Cheaper"
            ? -1000
            : 0;

        const priceModifier = finalPriceModifier(ticket, pM);

        return {
          participantId: uuid(),
          fullName: p.fullName,
          address: p.address,
          tShirtSize: p.tShirtSize,
          ticket: {
            ...ticket,
            priceModifier,
          },
          birthday: p.birthday,
          accommodation: p.accommodation,
        };
      });

      const paymentReason = paymentReasonForRegistrationCount(
        this.state.registrationCount
      );

      await this.saveEvent({
        type: "RegisterEvent",
        registrationId: uuid(),
        participants: persistedParticipants,
        paymentReason,
        email,
        comment,
      });

      this.mailSender.send(
        composeRegistrationMail(
          email,
          persistedParticipants[0].fullName,
          paymentReason,
          persistedParticipants.map((p) => ({
            name: formatTicket(this.findTicketOrThrow(p.ticket.ticketId), "de"),
            fullPrice: ticketPrice(p.ticket),
          })),
          comment
        )
      );
    });
  }

  public async cancelRegistration(registrationId: string) {
    return this.lock.acquire("mutate", async () => {
      const registration = this.state.registrations.find(
        (r) => r.registrationId === registrationId
      );

      if (registration !== undefined && registration.isCancelled === false) {
        await this.saveEvent({
          type: "CancelRegistrationEvent",
          registrationId,
        });
      }
    });
  }

  public async payRegistration(registrationId: string, amountInCents: number) {
    return this.lock.acquire("mutate", async () => {
      const registration = this.state.registrations.find(
        (r) => r.registrationId === registrationId
      );

      if (registration !== undefined) {
        await this.saveEvent({
          type: "PaymentReceivedEvent",
          amountInCents,
          registrationId,
          paymentId: uuid(),
        });

        const participants = this.getParticipantsForRegistration(
          registration.registrationId
        );

        if (participants !== undefined) {
          this.mailSender.send(
            composePaymentReceivedMail(
              registration.email,
              participants[0].fullName,
              amountInCents
            )
          );
        }
      }
    });
  }

  public async undoPayment(paymentId: string) {
    return this.lock.acquire("mutate", async () => {
      const payment = this.state.payments.find(
        (p) => p.paymentId === paymentId
      );

      if (payment !== undefined) {
        await this.saveEvent({
          type: "CancelPaymentEvent",
          paymentId,
        });
      }
    });
  }

  public getAllParticipants(): (Participant & { registrationId: string })[] {
    return this.state.participants.map(([registrationId, p]) => {
      return {
        ...p,
        registrationId,
      };
    });
  }

  public getEventsForRegistration(
    registrationId: string
  ): EventEnvelope<Event>[] {
    return this.state.eventsPerRegistration.get(registrationId) ?? [];
  }

  public getLimits(): Limits {
    return this.state.limits;
  }

  public getAvailableAccommodations(): Accommodation[] {
    return ACCOMMODATIONS.filter((a) => {
      const limit = this.state.limits[a];
      if (limit === undefined) {
        return true;
      }
      const current = this.getParticipantsForAccommodation(a, true, true);
      return current < limit;
    });
  }

  public isConventionFull(): boolean {
    if (this.state.limits.total === undefined) {
      return false;
    }
    return this.state.participants.length >= this.state.limits.total;
  }

  public getPaidStatus(registrationId: string): PaidStatus {
    return this.state.paidMap.get(registrationId) ?? "notPaid";
  }

  public getShirtSizeCount(): { [K in TShirtSize]: number } {
    const participants = this.state.participants.map(([_rId, p]) => p);

    return {
      S: participants.filter((p) => p.tShirtSize === "S").length,
      M: participants.filter((p) => p.tShirtSize === "M").length,
      L: participants.filter((p) => p.tShirtSize === "L").length,
      XL: participants.filter((p) => p.tShirtSize === "XL").length,
    };
  }

  public getFuzzyAddresses(): {
    postalCode: string;
    city: string;
    country: string;
  }[] {
    return this.state.participants.map(([_rId, p]) => {
      return {
        postalCode: p.address.postalCode,
        city: p.address.city,
        country: p.address.country,
      };
    });
  }

  public getSupporterSoliRatio(): { soli: number; support: number } {
    const participants = this.state.participants.map(([_rId, p]) => p);

    const support = participants.filter(
      (p) => p.ticket.priceModifier > 0
    ).length;
    const soli = participants.filter((p) => p.ticket.priceModifier < 0).length;

    return { support, soli };
  }

  public getComment(registrationId: string): string {
    return (
      this.state.registrations.find((r) => r.registrationId === registrationId)
        ?.comment ?? ""
    );
  }

  public getRegistrationHistogram(): [Day, number][] {
    const result: [Day, number][] = [];

    for (const date of this.state.registrationTimes) {
      const newDay = new Day(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const prev = result.pop();
      if (prev === undefined) {
        result.push([newDay, 1]);
      } else {
        if (prev[0].isEqual(newDay)) {
          result.push([prev[0], prev[1] + 1]);
        } else {
          result.push(prev);
          result.push([newDay, prev[1] + 1]);
        }
      }
    }

    return result;
  }

  public getAllRegistrations(): Registration[] {
    return this.state.registrations;
  }

  public getParticipantsForRegistration(registrationId: string): Participant[] {
    return this.state.participants
      .filter(([rId, _p]) => rId === registrationId)
      .map(([_rId, p]) => p);
  }

  public getParticipantsForAccommodation(
    accommodation: Accommodation,
    thuSun: boolean,
    friSun: boolean
  ): number {
    const daysTuple = this.state.accommodationMap.get(accommodation) ?? [0, 0];

    let result = 0;
    if (thuSun) {
      result += daysTuple[0];
    }
    if (friSun) {
      result += daysTuple[1];
    }
    return result;
  }

  private apply(event: EventEnvelope<Event>): void {
    const payload = event.payload;
    switch (payload.type) {
      case "RegisterEvent": {
        this.state.registrationCount += 1;
        payload.participants.forEach((p) => {
          this.state.participants.push([payload.registrationId, p]);
        });
        this.state.registrations.push({
          registrationId: payload.registrationId,
          comment: payload.comment,
          email: payload.email,
          paymentReason: payload.paymentReason,
          registeredAt: event.timeStamp,
          isCancelled: false,
        });

        payload.participants.forEach((p) => {
          const tuple = this.state.accommodationMap.get(p.accommodation) ?? [
            0, 0,
          ];
          if (p.ticket.from.isEqual(THURSDAY) && p.ticket.to.isEqual(SUNDAY)) {
            tuple[0] += 1;
          } else if (
            p.ticket.from.isEqual(FRIDAY) &&
            p.ticket.to.isEqual(SUNDAY)
          ) {
            tuple[1] += 1;
          }
          this.state.accommodationMap.set(p.accommodation, tuple);
        });

        this.state.paidMap.set(payload.registrationId, "notPaid");

        this.state.registrationTimes = this.state.registrationTimes.concat(
          Array(payload.participants.length).fill(event.timeStamp)
        );

        this.pushEventToRegistration(payload.registrationId, event);

        break;
      }
      case "CancelRegistrationEvent": {
        const registration = this.state.registrations.find(
          (r) => r.registrationId === payload.registrationId
        );
        if (registration !== undefined) {
          registration.isCancelled = true;
        }

        this.pushEventToRegistration(payload.registrationId, event);

        break;
      }
      case "PaymentReceivedEvent": {
        const status =
          this.state.paidMap.get(payload.registrationId) ?? "notPaid";

        if (status === "notPaid") {
          this.state.paidMap.set(payload.registrationId, [
            "paid",
            payload.amountInCents,
          ]);
        } else {
          this.state.paidMap.set(payload.registrationId, [
            "paid",
            status[1] + payload.amountInCents,
          ]);
        }
        this.state.payments.push({
          paymentId: payload.paymentId,
          amountInCents: payload.amountInCents,
          registrationId: payload.registrationId,
        });
        this.pushEventToRegistration(payload.registrationId, event);
        break;
      }
      case "CancelPaymentEvent": {
        const payment = this.state.payments.find(
          (p) => p.paymentId === payload.paymentId
        );
        if (payment === undefined) {
          break;
        }
        // TODO: change paid state
        this.state.payments = this.state.payments.filter(
          (p) => p.paymentId !== payload.paymentId
        );
        this.pushEventToRegistration(payment.registrationId, event);
        break;
      }
      default:
        assertNever(payload);
    }

    this.state.latestVersion = event.version;
  }

  private async saveEvent(event: Event): Promise<void> {
    const eventEnvelope = await this.eventStore.save(
      event,
      this.state.latestVersion + 1
    );

    this.apply(eventEnvelope);
  }

  private findTicketOrThrow(ticketId: string): Ticket {
    const ticket = TICKETS.find((t) => t.ticketId === ticketId);

    if (!ticket) {
      throw new Error(`couldn't find ticket ${ticketId}`);
    }

    return ticket;
  }

  private pushEventToRegistration(
    registrationId: string,
    event: EventEnvelope<Event>
  ): void {
    const existingEvents = this.state.eventsPerRegistration.get(registrationId);
    if (existingEvents === undefined) {
      this.state.eventsPerRegistration.set(registrationId, [event]);
    } else {
      existingEvents.push(event);
    }
  }
}

function composeRegistrationMail(
  toMailAddress: string,
  fullName: string,
  paymentReason: string,
  tickets: { name: string; fullPrice: Cents }[],
  comment: string
): Mail {
  const totalPrice = formatCurrency(
    tickets.map((t) => t.fullPrice).reduce((a, b) => a + b, 0),
    "EUR",
    "de"
  );
  const subject = "Bestellbestätigung Freiburger Jonglierfestival";
  const ticketLines = tickets
    .map((t) => `* ${t.name}: ${formatCurrency(t.fullPrice, "EUR", "de")}`)
    .join("\n");

  const body = `(English version below)

Liebe/r ${fullName},

du hast für das 23. Freiburger Jonglierfestival folgende Tickets bestellt:

${ticketLines}

Außerdem hast du uns folgenden Kommentar hinterlassen: ${comment}

Bitte überweise das Geld dafür bis zum 12.05.2022 auf unser Konto:

Empfänger: Jonglieren in Freiburg e.V.
Bank: Sparkasse Freiburg Nördlicher Breisgau
IBAN: DE26 6805 0101 0012 0917 91
BIC: FRSPDE66XXX
Betrag: ${totalPrice}
Verwendungszweck: ${paymentReason}

Wir freuen uns Dich auf dem Festival zu sehen.
Viele Grüße,
Dein Orgateam


-------English-------


Dear ${fullName},

you ordered the following tickets for the Freiburg Juggling Convention:

${ticketLines}

You sent us the following comment: ${comment}

Please transfer the money to our account until the 12th of May of 2022:

Recipient: Jonglieren in Freiburg e.V.
Bank: Sparkasse Freiburg Nördlicher Breisgau
IBAN: DE26 6805 0101 0012 0917 91
BIC: FRSPDE66XXX
Amount: ${totalPrice}
Reference: ${paymentReason}

We're looking forward to meeting you at the festival!
Cheers!
Your orga team
`;

  return {
    subject,
    body,
    from: MAIL_FROM,
    to: [toMailAddress],
    cc: [MAIL_CC],
  };
}

function composePaymentReceivedMail(
  toMailAddress: string,
  fullName: string,
  amount: number
): Mail {
  const receivedAmount = formatCurrency(amount, "EUR", "de");
  const subject = "Freiburger Jonglierfestival: Bezahlung erhalten";

  const body = `(English version below)

Liebe/r ${fullName},

wir haben deine Zahlung über ${receivedAmount} erhalten. Vielen Dank!

Wir freuen uns Dich auf dem Festival zu sehen.
Viele Grüße,
Dein Orgateam


-------English-------


Dear ${fullName},

we've received your payment of ${receivedAmount}.

We're looking forward to meeting you at the festival!
Cheers!
Your orga team
`;

  return {
    subject,
    body,
    from: MAIL_FROM,
    to: [toMailAddress],
    cc: [MAIL_CC],
  };
}

const MAIL_FROM =
  "Jonglieren in Freiburg e.V. <orga@jonglieren-in-freiburg.de>";
const MAIL_CC = MAIL_FROM;
