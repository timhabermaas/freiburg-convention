import { addEvent } from "./state";
import { EventStore } from "../services/stores/interface";
import { Event, EventEnvelope } from "~/domain/events";
import { v4 as uuid } from "uuid";
import {
  Accommodation,
  Address,
  Day,
  Participant,
  Ticket,
} from "~/domain/types";
import { TICKETS } from "./tickets";

interface State {
  personIds: Set<string>;
  latestVersion: number;
}

export class App {
  private eventStore: EventStore;
  private state: State = { personIds: new Set(), latestVersion: 0 };

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore;
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
    }[],
    comment: string
  ) {
    const persistedParticipants = participants.map((p) => {
      const ticket = this.findTicket(p.ticketId);

      if (!ticket) {
        throw new Error(`couldn't find ticket ${p.ticketId}`);
      }

      return {
        fullName: p.fullName,
        address: p.address,
        ticket: {
          from: ticket.from,
          to: ticket.to,
          price: ticket.price,
          category: ticket.category,
          ticketId: ticket.id,
        },
        birthday: p.birthday,
        accommodation: p.accommodation,
      };
    });

    if (this.state.personIds.size < 100) {
      await this.saveEvent({
        type: "RegisterEvent",
        registrationId: uuid(),
        participants: persistedParticipants,
        email,
        comment,
      });
    }
  }

  public async deleteRegistration(personId: string) {
    await this.saveEvent({
      type: "DeletePersonEvent",
      personId,
    });
  }

  private apply(event: EventEnvelope<Event>): void {
    switch (event.payload.type) {
      case "AddPersonEvent": {
        this.state.personIds.add(event.payload.personId);
        break;
      }
      case "DeletePersonEvent": {
        this.state.personIds.delete(event.payload.personId);
        break;
      }
    }

    this.state.latestVersion = event.version;
  }

  private async saveEvent(event: Event): Promise<void> {
    const eventEnvelope = await addEvent(
      this.eventStore,
      event,
      this.state.latestVersion + 1
    );

    this.apply(eventEnvelope);
  }

  private findTicket(ticketId: string): Ticket | undefined {
    return TICKETS.find((t) => t.id === ticketId);
  }
}
