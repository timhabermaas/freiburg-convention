import { EventStore } from "../services/stores/interface";
import { Event, EventEnvelope } from "~/domain/events";
import { v4 as uuid } from "uuid";
import {
  Accommodation,
  Address,
  AgeCategory,
  Day,
  Duration,
  Limits,
  PaidStatus,
  Participant,
  Registration,
  SupporterCategory,
  TShirtSize,
} from "~/domain/types";
import { price, stayFromDuration } from "./tickets";
import { MailSender } from "~/services/email/interface";
import {
  assertNever,
  formatTicket,
  paymentReasonForRegistrationCount,
  ticketPrice,
  ticketSumForParticipants,
} from "~/utils";
import { ACCOMMODATIONS } from "./accommodation";
import AsyncLock from "async-lock";
import {
  buildMail,
  composePaymentReceivedMail,
  composePaymentReminderMail,
  composeRegistrationMail,
} from "./emails.server";
import { CONFIG } from "~/config.server";

interface State {
  latestVersion: number;
  /** Counts all registrations, used for payment reason. Should never be reduced over time to avoid conflicts. */
  registrationCount: number;
  participants: Participant[];
  registrations: Registration[];
  payments: {
    paymentId: string;
    amountInCents: number;
    registrationId: string;
  }[];
  eventsPerRegistration: Map<string, EventEnvelope<Event>[]>;
  limits: Limits;
  // Contains the registration date for each participant, ascending order
  registrationTimes: Date[];
}

function initState(): State {
  return {
    latestVersion: 0,
    registrationCount: 0,
    participants: [],
    registrations: [],
    payments: [],
    eventsPerRegistration: new Map(),
    limits: {
      total: 350,
      gym: 154,
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
      birthday: Day;
      ageCategory: AgeCategory;
      duration: Duration;
      accommodation: Accommodation;
      supporterCategory: SupporterCategory;
      tShirtSize?: TShirtSize;
    }[],
    comment: string
  ) {
    return this.lock.acquire("mutate", async () => {
      const persistedParticipants = participants.map((p) => {
        const pr = price(p.ageCategory, p.duration, p.supporterCategory);

        return {
          participantId: uuid(),
          fullName: p.fullName,
          address: p.address,
          tShirtSize: p.tShirtSize,
          ticket: {
            ageCategory: p.ageCategory,
            price: pr,
            supporterCategory: p.supporterCategory,
            from: stayFromDuration(p.duration)[0],
            to: stayFromDuration(p.duration)[1],
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

      await this.mailSender.send(
        composeRegistrationMail(
          email,
          persistedParticipants[0].fullName,
          paymentReason,
          persistedParticipants.map((p) => ({
            name: formatTicket(p.ticket, "de"),
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

  public async changeAccommodation(
    participantId: string,
    newAccommodation: Accommodation
  ) {
    return this.lock.acquire("mutate", async () => {
      const participant = this.state.participants.find(
        (p) => p.participantId === participantId
      );

      if (participant === undefined) {
        return undefined;
      }

      const registration = this.state.registrations.find(
        (r) => r.registrationId === participant.registrationId
      );

      if (registration === undefined) {
        return undefined;
      }

      await this.saveEvent({
        type: "ChangeAccommodationEvent",
        participantId: participant.participantId,
        registrationId: registration.registrationId,
        from: participant.accommodation,
        to: newAccommodation,
      });
    });
  }

  public async sendPaymentReminderMail(registrationIds: string[]) {
    return this.lock.acquire("mutate", async () => {
      const registrations = this.state.registrations.filter((r) =>
        registrationIds.includes(r.registrationId)
      );

      for (const registration of registrations) {
        const participants = this.getParticipantsForRegistration(
          registration.registrationId
        );

        await this.mailSender.send(
          composePaymentReminderMail(
            registration.email,
            participants[0].fullName,
            registration.paymentReason,
            participants.map((p) => ({
              name: formatTicket(p.ticket, "de"),
              fullPrice: ticketPrice(p.ticket),
            }))
          )
        );

        await this.saveEvent({
          type: "PaymentReminderMailSentEvent",
          registrationId: registration.registrationId,
        });
      }
    });
  }

  public async sendGenericEmail(
    registrationIds: string[],
    emailSubject: string,
    emailBody: string
  ) {
    const registrations = this.getAllRegistrations().filter((r) =>
      registrationIds.includes(r.registrationId)
    );

    for (const registration of registrations) {
      await this.mailSender.send(
        buildMail(registration.email, emailSubject, emailBody)
      );
    }
  }

  public async sendGenericTestEmail(
    toAddress: string,
    emailSubject: string,
    emailBody: string
  ) {
    await this.mailSender.send(buildMail(toAddress, emailSubject, emailBody));
  }

  public getAllActualParticipants(): Participant[] {
    return this.state.participants.filter((p) => p.isCancelled === false);
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
      const current = this.getParticipantCountForAccommodation(a);
      return current < limit;
    });
  }

  public isConventionFull(): boolean {
    if (this.state.limits.total === undefined) {
      return false;
    }
    return this.getAllActualParticipants().length >= this.state.limits.total;
  }

  public getPaidStatus(registrationId: string): PaidStatus {
    const payments = this.state.payments.filter(
      (p) => p.registrationId === registrationId
    );

    const sum = payments.reduce((acc, x) => acc + x.amountInCents, 0);

    return payments.length === 0
      ? { type: "notPaid" }
      : { type: "paid", amountInCents: sum };
  }

  public getShirtSizeCount(): { [K in TShirtSize]: number } {
    const participants = this.getAllActualParticipants();

    return {
      S: participants.filter((p) => p.tShirtSize === "S").length,
      M: participants.filter((p) => p.tShirtSize === "M").length,
      L: participants.filter((p) => p.tShirtSize === "L").length,
      XL: participants.filter((p) => p.tShirtSize === "XL").length,
    };
  }

  public getTotalPaidAmount(): number {
    return this.state.payments.reduce((sum, p) => p.amountInCents + sum, 0);
  }

  public getMissingAmount(): number {
    const registrations = this.getAllActualRegistrations();
    const payments = this.state.payments;

    const unPaidRegistrations = registrations.filter(
      (r) =>
        payments.find((p) => p.registrationId === r.registrationId) ===
        undefined
    );

    return unPaidRegistrations
      .map((r) =>
        ticketSumForParticipants(
          this.getParticipantsForRegistration(r.registrationId)
        )
      )
      .reduce((sum, amount) => sum + amount, 0);
  }

  public getFuzzyAddresses(): {
    postalCode: string;
    city: string;
    country: string;
  }[] {
    return this.state.participants.map((p) => {
      return {
        postalCode: p.address.postalCode,
        city: p.address.city,
        country: p.address.country,
      };
    });
  }

  // TODO: Fix me
  public getSupporterSoliRatio(): { soli: number; support: number } {
    const participants = this.getAllActualParticipants();

    const support = participants.filter(
      (p) => p.ticket.supporterCategory === "Supporter"
    ).length;
    const soli = participants.filter(
      (p) => p.ticket.supporterCategory === "Cheaper"
    ).length;

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
      const newDay = Day.fromDate(date);
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

  public getAllActualRegistrations(): Registration[] {
    return this.getAllRegistrations().filter((r) => r.isCancelled === false);
  }

  public getParticipantsForRegistration(registrationId: string): Participant[] {
    return this.state.participants.filter(
      (p) => p.registrationId === registrationId
    );
  }

  public getAccommodationDayMap(): Record<string, number> {
    const result: Record<string, number> = {};

    this.getAllActualParticipants().forEach((p) => {
      CONFIG.event.conventionDays.forEach((day) => {
        const accDayCount = result[p.accommodation + "-" + day.toJSON()] ?? 0;
        if (day.isWithin(p.ticket.from, p.ticket.to)) {
          result[p.accommodation + "-" + day.toJSON()] = accDayCount + 1;
          const dayCount = result[day.toJSON()] ?? 0;
          result[day.toJSON()] = dayCount + 1;
        }
      });
      let accCount = result[p.accommodation] ?? 0;
      result[p.accommodation] = accCount + 1;
    });

    return result;
  }

  public getParticipantCountForAccommodation(
    accommodation: Accommodation
  ): number {
    let result = 0;

    this.getAllActualParticipants().forEach((p) => {
      if (p.accommodation === accommodation) {
        result += 1;
      }
    });

    return result;
  }

  private apply(event: EventEnvelope<Event>): void {
    const payload = event.payload;
    switch (payload.type) {
      case "RegisterEvent": {
        this.state.registrationCount += 1;
        payload.participants.forEach((p) => {
          this.state.participants.push({
            registrationId: payload.registrationId,
            isCancelled: false,
            ...p,
          });
        });
        this.state.registrations.push({
          registrationId: payload.registrationId,
          comment: payload.comment,
          email: payload.email,
          paymentReason: payload.paymentReason,
          registeredAt: event.timeStamp,
          isCancelled: false,
        });

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

        const participants = this.state.participants.map((p) => {
          if (p.registrationId === payload.registrationId) {
            return {
              ...p,
              isCancelled: true,
            };
          } else {
            return p;
          }
        });
        this.state.participants = participants;

        this.pushEventToRegistration(payload.registrationId, event);

        break;
      }
      case "PaymentReceivedEvent": {
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
        this.state.payments = this.state.payments.filter(
          (p) => p.paymentId !== payload.paymentId
        );
        this.pushEventToRegistration(payment.registrationId, event);
        break;
      }
      case "ChangeAccommodationEvent": {
        const index = this.state.participants.findIndex(
          (p) => p.participantId === payload.participantId
        );

        if (index !== undefined) {
          this.state.participants[index].accommodation = payload.to;
          this.pushEventToRegistration(payload.registrationId, event);
        }

        break;
      }
      case "PaymentReminderMailSentEvent": {
        this.pushEventToRegistration(payload.registrationId, event);

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
