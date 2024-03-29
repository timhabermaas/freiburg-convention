import { z } from "zod";
import { isoDateString } from "~/utils";
import {
  Accommodation,
  Address,
  AgeCategory,
  Day,
  OrderedTicket,
  SupporterCategory,
  TShirtSize,
} from "./types";

export interface EventEnvelope<E> {
  id: string;
  version: number;
  payload: E;
  timeStamp: Date;
}

export interface NestedParticipant {
  participantId: string;
  fullName: string;
  birthday: Day;
  address: Address;
  ticket: OrderedTicket;
  accommodation: Accommodation;
  tShirtSize?: TShirtSize;
}

export interface RegisterEvent {
  registrationId: string;
  participants: NestedParticipant[];
  email: string;
  comment: string;
  paymentReason: string;
  type: "RegisterEvent";
}

export interface CancelRegistrationEvent {
  registrationId: string;
  type: "CancelRegistrationEvent";
}

export interface PaymentReceivedEvent {
  registrationId: string;
  paymentId: string;
  amountInCents: number;
  type: "PaymentReceivedEvent";
}

export interface CancelPaymentEvent {
  paymentId: string;
  type: "CancelPaymentEvent";
}

export interface ChangeAccommodationEvent {
  registrationId: string;
  participantId: string;
  from: Accommodation;
  to: Accommodation;
  type: "ChangeAccommodationEvent";
}

export interface PaymentReminderMailSentEvent {
  registrationId: string;
  type: "PaymentReminderMailSentEvent";
}

export const DaySchema: z.ZodSchema<Day, z.ZodTypeDef, string> = z
  .string()
  .regex(/^\d+-\d+-\d+$/)
  .transform((s) => Day.parse(s));

const AddressSchema: z.ZodSchema<Address> = z.object({
  postalCode: z.string().nullable(),
  country: z.string().nullable(),
});

export const AccommodationSchema: z.ZodSchema<
  Accommodation,
  z.ZodTypeDef,
  unknown
> = z.union([z.literal("gym"), z.literal("tent"), z.literal("selfOrganized")]);

export const AgeCategorySchema: z.ZodSchema<
  AgeCategory,
  z.ZodTypeDef,
  unknown
> = z.union([z.literal("Baby"), z.literal("Child"), z.literal("OlderThan12")]);

export const SupporterCategorySchema: z.ZodSchema<
  SupporterCategory,
  z.ZodTypeDef,
  unknown
> = z.union([
  z.literal("Supporter"),
  z.literal("Normal"),
  z.literal("Cheaper"),
]);

const TicketSchema: z.ZodSchema<OrderedTicket, z.ZodTypeDef, unknown> =
  z.object({
    from: DaySchema,
    to: DaySchema,
    price: z.number(),
    ageCategory: AgeCategorySchema,
    supporterCategory: SupporterCategorySchema,
    ticketId: z.string(),
  });

const TShirtSizeSchema: z.ZodSchema<TShirtSize, z.ZodTypeDef, unknown> =
  z.union([z.literal("S"), z.literal("M"), z.literal("L"), z.literal("XL")]);

export const NestedParticipantSchema: z.ZodSchema<
  NestedParticipant,
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

export type Event =
  | RegisterEvent
  | CancelRegistrationEvent
  | PaymentReceivedEvent
  | CancelPaymentEvent
  | ChangeAccommodationEvent
  | PaymentReminderMailSentEvent;

export const EventSchema: z.ZodSchema<Event, z.ZodTypeDef, unknown> =
  z.discriminatedUnion("type", [
    z.object({
      registrationId: z.string(),
      participants: z.array(NestedParticipantSchema),
      email: z.string(),
      comment: z.string(),
      paymentReason: z.string(),
      type: z.literal("RegisterEvent"),
    }),
    z.object({
      registrationId: z.string(),
      type: z.literal("CancelRegistrationEvent"),
    }),
    z.object({
      registrationId: z.string(),
      paymentId: z.string(),
      amountInCents: z.number(),
      type: z.literal("PaymentReceivedEvent"),
    }),
    z.object({
      paymentId: z.string(),
      type: z.literal("CancelPaymentEvent"),
    }),
    z.object({
      registrationId: z.string(),
      participantId: z.string(),
      from: AccommodationSchema,
      to: AccommodationSchema,
      type: z.literal("ChangeAccommodationEvent"),
    }),
    z.object({
      registrationId: z.string(),
      type: z.literal("PaymentReminderMailSentEvent"),
    }),
  ]);

export const EventEnvelopeSchema = z.object({
  id: z.string(),
  version: z.number(),
  payload: EventSchema,
  timeStamp: isoDateString,
});

export const EventEnvelopeArray = z.array(EventEnvelopeSchema);
