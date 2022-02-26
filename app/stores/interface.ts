import { EventEnvelope, Event } from "~/types";

export interface EventStore {
  readAll(): Promise<EventEnvelope<Event>[]>;
  save(payload: Event, versionNumber: number): Promise<EventEnvelope<Event>>;
}
