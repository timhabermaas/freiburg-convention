import { ActionFunction, json, redirect, useActionData } from "remix";
import { Col } from "~/components/Col";
import { Row } from "~/components/Row";
import { SubmitButton } from "~/components/SubmitButton";
import { TextField } from "~/components/TextField";
import { TextInput } from "~/components/TextInput";
import { useTranslation } from "~/hooks/useTranslation";
import { z } from "zod";
import {
  errorsForPath,
  formatTicket,
  getObject,
  getValue,
  NestedParams,
  parseFormData,
} from "~/utils";
import { useLocale } from "~/hooks/useLocale";
import { DateInput } from "~/components/DateInput";
import { useState } from "react";
import { Accommodation, Address, Day } from "~/domain/types";
import { RadioGroup } from "~/components/RadioGroup";
import { TICKETS } from "~/domain/tickets";
import { Select } from "~/components/Select";
import { ACCOMMODATIONS } from "~/domain/accommodation";
import { App } from "~/domain/app";
import * as i18n from "~/i18n";

const AddressSchema: z.ZodSchema<Address> = z.object({
  street: z.string(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
});

const Int = z.string().regex(/^\d+$/).transform(Number);

const DaySchema: z.ZodSchema<Day, z.ZodTypeDef, unknown> = z
  .object({
    day: Int,
    month: Int,
    year: Int,
  })
  .transform(({ year, month, day }) => new Day(year, month, day));

const AccommodationSchema: z.ZodSchema<Accommodation, z.ZodTypeDef, unknown> =
  z.union([z.literal("gym"), z.literal("tent"), z.literal("selfOrganized")]);

const ParticipantSchema = z.object({
  fullName: z.string().nonempty(),
  birthday: DaySchema,
  address: AddressSchema,
  ticketId: z.string().uuid(),
  accommodation: AccommodationSchema,
});

// TODO: Signature is lying, it's not fully validated yet.
function participantIsEmpty(p: z.infer<typeof ParticipantSchema>): boolean {
  if (
    typeof p.fullName === "string" &&
    typeof p.address?.street === "string" &&
    typeof p.address?.postalCode === "string" &&
    typeof p.address?.city === "string"
  ) {
    return (
      p.fullName.trim().length === 0 &&
      p.address.street.trim().length === 0 &&
      p.address.postalCode.trim().length === 0 &&
      p.address.city.trim().length === 0
    );
  } else {
    return true;
  }
}

const Form = z.object({
  email: z.string().email(),
  participants: z.preprocess((participants) => {
    if (Array.isArray(participants)) {
      return participants.filter((participant, i) => {
        // Always keep first participant
        if (i === 0) {
          return true;
        }

        return !participantIsEmpty(participant);
      });
    } else {
      return participants;
    }
  }, z.array(ParticipantSchema)),
  comment: z.string(),
  bot: z.string().refine((b) => b.length === 0),
});

export const action: ActionFunction = async ({ params, context, request }) => {
  const app = context.app as App;
  const formData = await request.formData();

  const parsedFormData = parseFormData(formData);
  console.log(JSON.stringify(parsedFormData));

  const result = Form.safeParse(parsedFormData);
  console.log(JSON.stringify(result));

  if (result.success) {
    await app.registerPerson(
      result.data.email,
      result.data.participants,
      result.data.comment
    );

    return redirect("success");
  } else {
    return json({ errors: result.error.issues, values: parsedFormData });
  }
};

interface ParticipantFormProps {
  index: number;
  errors?: z.ZodIssue[];
  defaultParticipant?: NestedParams;
}

function ParticipantForm(props: ParticipantFormProps) {
  const { locale } = useLocale();
  const t = useTranslation();
  const withPrefix = (name: string): string =>
    `participants.${props.index}.${name}`;

  return (
    <Row>
      <Col size="md" cols={12}>
        <h4>{t(i18n.participantHeader(props.index + 1))}</h4>
        <TextInput
          label={t(i18n.fullNameField)}
          name={withPrefix("fullName")}
          defaultValue={getValue(props.defaultParticipant ?? {}, "fullName")}
          errorMessages={
            props.errors
              ? errorsForPath(withPrefix("fullName"), props.errors)
              : undefined
          }
        />
        <DateInput
          label={t(i18n.birthdayField)}
          name={withPrefix("birthday")}
          defaultDate={getObject(props.defaultParticipant ?? {}, "birthday")}
        />
        <TextInput
          label={t(i18n.streetField)}
          name={withPrefix("address.street")}
          defaultValue={getValue(
            props.defaultParticipant ?? {},
            "address",
            "street"
          )}
        />
        <TextInput
          label={t(i18n.postalCodeField)}
          name={withPrefix("address.postalCode")}
          defaultValue={getValue(
            props.defaultParticipant ?? {},
            "address",
            "postalCode"
          )}
        />
        <TextInput
          label={t(i18n.cityField)}
          name={withPrefix("address.city")}
          defaultValue={getValue(
            props.defaultParticipant ?? {},
            "address",
            "city"
          )}
        />
        <TextInput
          label={t(i18n.countryField)}
          name={withPrefix("address.country")}
          defaultValue={getValue(
            props.defaultParticipant ?? {},
            "address",
            "country"
          )}
        />
        <RadioGroup
          label={t(i18n.ticketField)}
          name={withPrefix("ticketId")}
          options={TICKETS.map((t) => ({
            label: formatTicket(t, locale),
            value: t.ticketId,
          }))}
          defaultValue={getValue(props.defaultParticipant ?? {}, "ticketId")}
          errorMessages={
            props.errors
              ? errorsForPath(withPrefix("ticketId"), props.errors)
              : undefined
          }
        />
        <Select
          label={t(i18n.accommodationField)}
          name={withPrefix("accommodation")}
          options={ACCOMMODATIONS.map((a) => ({
            label: t(i18n.accommodationFieldType(a)),
            value: a,
          }))}
        />
      </Col>
    </Row>
  );
}

export default function NewRegistration() {
  const { dateTimeFormatter } = useLocale();

  const t = useTranslation();
  // TODO: Typing
  const actionData = useActionData();

  const [participantCount, setParticipantCount] = useState<number>(
    actionData?.values?.participants ? actionData.values.participants.length : 1
  );

  return (
    <>
      <Row>
        <Col size="md" cols={12}>
          <h1 className="text-center">{t(i18n.registrationTitle)}</h1>
          <h4 className="text-center">
            <small className="text-muted">
              {dateTimeFormatter.format(Date.parse("2022-05-26"))} –{" "}
              {dateTimeFormatter.format(Date.parse("2022-05-29"))}
            </small>
          </h4>
        </Col>
      </Row>
      <Row centered>
        <Col size="lg" cols={6}>
          <form method="post">
            <TextInput
              label={t(i18n.email)}
              name="email"
              autoComplete="email"
              defaultValue={actionData?.values?.email}
              errorMessages={
                actionData?.errors
                  ? errorsForPath("email", actionData?.errors)
                  : undefined
              }
            />
            <TextInput label={"Full name"} name="bot" hidden />

            {[...Array(participantCount).keys()].map((i) => (
              <div>
                <ParticipantForm
                  key={i}
                  index={i}
                  defaultParticipant={actionData?.values?.participants?.[i]}
                  errors={actionData?.errors}
                ></ParticipantForm>
                <div className="mb-3"></div>
              </div>
            ))}
            <div>
              <button
                className="btn btn-info"
                onClick={(e) => {
                  e.preventDefault();
                  setParticipantCount((c) => c + 1);
                }}
              >
                {t(i18n.moreParticipants)}
              </button>
            </div>
            <br />
            <br />

            <TextField
              label={t(i18n.commentField)}
              name="comment"
              defaultValue={actionData?.values?.comment}
            />
            <SubmitButton title={t(i18n.submitRegister)} />
          </form>
        </Col>
      </Row>
    </>
  );
}
