import { EventEnvelope, Event } from "~/domain/events";

export interface EventStore {
  readAll(): Promise<EventEnvelope<Event>[]>;
  save(payload: Event, versionNumber: number): Promise<EventEnvelope<Event>>;
}
