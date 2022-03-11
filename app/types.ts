import { z } from "zod";

export interface Address {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface Participant {
  fullName: string;
  birthday: Date;
  address: Address;
}

export interface EventEnvelope<E> {
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

export const EventSchema = z.discriminatedUnion("type", [
  z.object({
    personId: z.string(),
    name: z.string(),
    type: z.literal("AddPersonEvent"),
  }),
  z.object({
    personId: z.string(),
    type: z.literal("DeletePersonEvent"),
  }),
]);

const isoString = z.string().transform((s) => new Date(Date.parse(s)));

export const EventEnvelopeSchema = z.object({
  id: z.string(),
  version: z.number(),
  payload: EventSchema,
  timeStamp: isoString,
});

export const EventEnvelopeArray = z.array(EventEnvelopeSchema);
