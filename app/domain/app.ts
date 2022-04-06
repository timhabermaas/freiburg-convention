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
} from "~/domain/types";
import { TICKETS } from "./tickets";
import { MailSender } from "~/services/email/interface";
import { formatCurrency } from "~/i18n";
import {
  assertNever,
  formatTicket,
  paymentReasonForRegistrationCount,
  ticketPrice,
} from "~/utils";

interface State {
  latestVersion: number;
  registrationCount: number;
  participants: [string, Participant][];
  registrations: Registration[];
  // Maps from registrationId to PaidStatus
  paidMap: Map<string, PaidStatus>;
  // Maps from the accommodation to Thu–Sun/Fri–Sun
  accommodationMap: Map<Accommodation, [number, number]>;
  limits: Limits;
}

const THURSDAY = new Day(2022, 5, 26);
const FRIDAY = new Day(2022, 5, 27);
const SUNDAY = new Day(2022, 5, 29);

export class App {
  private eventStore: EventStore;
  private mailSender: MailSender;
  private state: State = {
    latestVersion: 0,
    registrationCount: 0,
    participants: [],
    registrations: [],
    accommodationMap: new Map(),
    paidMap: new Map(),
    limits: {
      total: 250,
      gym: 25,
      camping: 150,
    },
  };

  constructor(eventStore: EventStore, mailSender: MailSender) {
    this.eventStore = eventStore;
    this.mailSender = mailSender;

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

  public async replay(): Promise<void> {
    for (const event of await this.eventStore.readAll()) {
      this.apply(event);
    }
  }

  // TODO: Make sure the mutating functions are pushed to queue (`fastq`) and handled serialized.
  public async registerPerson(
    email: string,
    participants: {
      fullName: string;
      address: Address;
      ticketId: string;
      birthday: Day;
      accommodation: Accommodation;
      priceModifier?: "Supporter" | "Cheaper";
    }[],
    comment: string
  ) {
    const persistedParticipants = participants.map((p) => {
      const ticket = this.findTicketOrThrow(p.ticketId);

      return {
        participantId: uuid(),
        fullName: p.fullName,
        address: p.address,
        ticket: {
          ...ticket,
          priceModifier:
            p.priceModifier === "Supporter"
              ? 1000
              : p.priceModifier === "Cheaper"
              ? -1000
              : 0,
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
      composeMail(
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
  }

  public getAllParticipants(): (Participant & { registrationId: string })[] {
    return this.state.participants.map(([registrationId, p]) => {
      return {
        ...p,
        registrationId,
      };
    });
  }

  public getLimits(): Limits {
    return this.state.limits;
  }

  public getPaidStatus(registrationId: string): PaidStatus {
    return this.state.paidMap.get(registrationId) ?? "notPaid";
  }

  public getComment(registrationId: string): string {
    return (
      this.state.registrations.find((r) => r.registrationId === registrationId)
        ?.comment ?? ""
    );
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
    switch (event.payload.type) {
      case "RegisterEvent": {
        this.state.registrationCount += 1;
        event.payload.participants.forEach((p) => {
          this.state.participants.push([event.payload.registrationId, p]);
        });
        this.state.registrations.push({
          registrationId: event.payload.registrationId,
          comment: event.payload.comment,
          email: event.payload.email,
          paymentReason: event.payload.paymentReason,
          registeredAt: event.timeStamp,
        });

        event.payload.participants.forEach((p) => {
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

        this.state.paidMap.set(event.payload.registrationId, "notPaid");

        break;
      }
      default:
        assertNever(event.payload.type);
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
}

function composeMail(
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
Viele Grüße Dein
Orgateam


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
    from: "Jonglieren in Freiburg e.V. <orga@jonglieren-in-freiburg.de>",
    to: [toMailAddress],
    cc: [],
  };
}
