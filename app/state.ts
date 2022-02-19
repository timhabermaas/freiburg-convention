import { EventStore } from "~/stores/interface";
import { EventEnvelope, Event } from "~/types";

let state: State = { persons: [] };

export interface Person {
  name: string;
  id: string;
}

interface State {
  persons: Person[];
}

export function addEvent(store: EventStore, payload: Event) {
  store.save(payload);

  applyEvent(state, payload);
}

export function getEvents(store: EventStore): Promise<EventEnvelope<Event>[]> {
  return store.readAll();
}

export function getPersons(): Person[] {
  return state.persons;
}

function applyEvent(state: State, event: Event): void {
  switch (event.type) {
    case "AddPersonEvent":
      state.persons.push({ name: event.name, id: event.personId });

      break;
    case "DeletePersonEvent":
      state.persons = state.persons.filter((p) => p.id !== event.personId);

      break;
  }
}

function clearStore() {
  state.persons = [];
}

export async function replayEvents(store: EventStore) {
  clearStore();

  for (const event of await getEvents(store)) {
    applyEvent(state, event.payload);
  }
}
