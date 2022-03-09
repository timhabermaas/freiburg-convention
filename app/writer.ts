import { addEvent } from "./state";
import { EventStore } from "./stores/interface";
import { Event, EventEnvelope } from "~/types";
import { v4 as uuid } from "uuid";

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
  public async registerPerson(name: string) {
    if (this.state.personIds.size < 100) {
      await this.saveEvent({
        type: "AddPersonEvent",
        name: name,
        personId: uuid(),
      });
    }
  }

  public async deletePerson(personId: string) {
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
}
