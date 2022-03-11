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
  getObject,
  getValue,
  NestedParams,
  parseFormData,
} from "~/utils";
import { useLocale } from "~/hooks/useLocale";
import { DateInput } from "~/components/DateInput";
import { useState } from "react";
import { Address, Day, Participant } from "~/types";

const AddressSchema: z.ZodSchema<Address> = z.object({
  street: z.string(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
});

const Int = z.string().regex(/^\d+$/).transform(Number);

const DaySchema: z.ZodSchema<
  Day,
  z.ZodTypeDef,
  { day: string; month: string; year: string }
> = z
  .object({
    day: Int,
    month: Int,
    year: Int,
  })
  .transform(({ year, month, day }) => new Day(year, month, day));

const ParticipantSchema: z.ZodSchema<
  Participant,
  z.ZodTypeDef,
  {
    fullName: string;
    birthday: { day: string; month: string; year: string };
    address: Address;
  }
> = z.object({
  fullName: z.string().nonempty(),
  birthday: DaySchema,
  address: AddressSchema,
});

// TODO: Signature is lying
function participantIsEmpty(p: Participant): boolean {
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
  const formData = await request.formData();

  const parsedFormData = parseFormData(formData);
  console.log(JSON.stringify(parsedFormData));

  const result = Form.safeParse(parsedFormData);
  console.log(JSON.stringify(result));

  if (result.success) {
    await context.app.registerPerson(result.data.email);

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
  const t = useTranslation();
  const withPrefix = (name: string): string =>
    `participants.${props.index}.${name}`;

  return (
    <Row>
      <Col size="md" cols={12}>
        <h4>
          {t("participantHeader", { index: (props.index + 1).toString() })}
        </h4>
        <TextInput
          label={t("fullNameField")}
          name={withPrefix("fullName")}
          defaultValue={getValue(props.defaultParticipant ?? {}, "fullName")}
          errorMessages={
            props.errors
              ? errorsForPath(withPrefix("fullName"), props.errors)
              : undefined
          }
        />
        <DateInput
          label={t("birthdayField")}
          name={withPrefix("birthday")}
          defaultDate={getObject(props.defaultParticipant ?? {}, "birthday")}
        />
        <TextInput
          label={t("streetField")}
          name={withPrefix("address.street")}
          defaultValue={getValue(
            props.defaultParticipant ?? {},
            "address",
            "street"
          )}
        />
        <TextInput
          label={t("postalCodeField")}
          name={withPrefix("address.postalCode")}
          defaultValue={getValue(
            props.defaultParticipant ?? {},
            "address",
            "postalCode"
          )}
        />
        <TextInput
          label={t("cityField")}
          name={withPrefix("address.city")}
          defaultValue={getValue(
            props.defaultParticipant ?? {},
            "address",
            "city"
          )}
        />
        <TextInput
          label={t("countryField")}
          name={withPrefix("address.country")}
          defaultValue={getValue(
            props.defaultParticipant ?? {},
            "address",
            "country"
          )}
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
          <h1 className="text-center">{t("registrationTitle")}</h1>
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
              label={t("email")}
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
              <ParticipantForm
                key={i}
                index={i}
                defaultParticipant={actionData?.values?.participants?.[i]}
                errors={actionData?.errors}
              ></ParticipantForm>
            ))}
            <div>
              <a
                href="#"
                id="link"
                onClick={(e) => {
                  e.preventDefault();
                  setParticipantCount((c) => c + 1);
                }}
              >
                {t("moreParticipants")}
              </a>
            </div>
            <br />
            <br />

            <TextField
              label={t("commentField")}
              name="comment"
              defaultValue={actionData?.values?.comment}
            />
            <SubmitButton title={t("submitRegister")} />
          </form>
        </Col>
      </Row>
    </>
  );
}
