import { z } from "zod";
import { isoDateString } from "~/utils";
import {
  Accommodation,
  Address,
  AgeCategory,
  Day,
  Participant,
  OrderedTicket,
  TShirtSize,
} from "./types";

export interface EventEnvelope<E> {
  id: string;
  version: number;
  payload: E;
  timeStamp: Date;
}

export interface RegisterEvent {
  registrationId: string;
  participants: Participant[];
  email: string;
  comment: string;
  paymentReason: string;
  type: "RegisterEvent";
}

export interface CancelRegistrationEvent {
  registrationId: string;
  type: "CancelRegistrationEvent";
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

export const AccommodationSchema: z.ZodSchema<
  Accommodation,
  z.ZodTypeDef,
  unknown
> = z.union([z.literal("gym"), z.literal("tent"), z.literal("selfOrganized")]);

const AgeCategorySchema: z.ZodSchema<AgeCategory, z.ZodTypeDef, unknown> =
  z.union([z.literal("Baby"), z.literal("Child"), z.literal("OlderThan12")]);

const TicketSchema: z.ZodSchema<OrderedTicket, z.ZodTypeDef, unknown> =
  z.object({
    from: DaySchema,
    to: DaySchema,
    price: z.number(),
    ageCategory: AgeCategorySchema,
    ticketId: z.string(),
    priceModifier: z.number(),
  });

const TShirtSizeSchema: z.ZodSchema<TShirtSize, z.ZodTypeDef, unknown> =
  z.union([z.literal("S"), z.literal("M"), z.literal("L"), z.literal("XL")]);

export const ParticipantSchema: z.ZodSchema<
  Participant,
  z.ZodTypeDef,
  unknown
> = z.object({
  participantId: z.string().uuid(),
  fullName: z.string(),
  birthday: DaySchema,
  address: AddressSchema,
  ticket: TicketSchema,
  accommodation: AccommodationSchema,
  tShirtSize: TShirtSizeSchema.optional(),
});

export type Event = RegisterEvent | CancelRegistrationEvent;

export const EventSchema: z.ZodSchema<Event, z.ZodTypeDef, unknown> =
  z.discriminatedUnion("type", [
    z.object({
      registrationId: z.string(),
      participants: z.array(ParticipantSchema),
      email: z.string(),
      comment: z.string(),
      paymentReason: z.string(),
      type: z.literal("RegisterEvent"),
    }),
    z.object({
      registrationId: z.string(),
      type: z.literal("CancelRegistrationEvent"),
    }),
  ]);

export const EventEnvelopeSchema = z.object({
  id: z.string(),
  version: z.number(),
  payload: EventSchema,
  timeStamp: isoDateString,
});

export const EventEnvelopeArray = z.array(EventEnvelopeSchema);
