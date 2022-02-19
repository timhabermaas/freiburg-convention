export interface HasType {
  type: string;
}

export interface EventEnvelope<E extends HasType> {
  id: string;
  version: number;
  payload: E;
  timeStamp: Date;
}

export interface AddPersonEvent {
  personId: string;
  name: string;
  type: "AddPersonEvent";
}

export interface DeletePersonEvent {
  personId: string;
  type: "DeletePersonEvent";
}

export type Event = AddPersonEvent | DeletePersonEvent;
