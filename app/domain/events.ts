import { z } from "zod";
import { Address, Day, Participant } from "./types";

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

export interface RegisterEvent {
  registrationId: string;
  participants: Participant[];
  email: string;
  comment: string;
  type: "RegisterEvent";
}

const DaySchema: z.ZodSchema<Day, z.ZodTypeDef, string> = z
  .string()
  .regex(/^\d+-\d+-\d+$/)
  .transform((s) => Day.parse(s));

const AddressSchema: z.ZodSchema<Address> = z.object({
  street: z.string(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
});

const ParticipantSchema: z.ZodSchema<Participant, z.ZodTypeDef, unknown> =
  z.object({
    fullName: z.string(),
    birthday: DaySchema,
    address: AddressSchema,
  });

export type Event = AddPersonEvent | DeletePersonEvent | RegisterEvent;

export const EventSchema: z.ZodSchema<Event, z.ZodTypeDef, unknown> =
  z.discriminatedUnion("type", [
    z.object({
      personId: z.string(),
      name: z.string(),
      type: z.literal("AddPersonEvent"),
    }),
    z.object({
      personId: z.string(),
      type: z.literal("DeletePersonEvent"),
    }),
    z.object({
      registrationId: z.string(),
      participants: z.array(ParticipantSchema),
      email: z.string(),
      comment: z.string(),
      type: z.literal("RegisterEvent"),
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
