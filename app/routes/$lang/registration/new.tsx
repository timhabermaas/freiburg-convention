import { ActionFunction, json, redirect, useActionData } from "remix";
import { Col } from "~/components/Col";
import { Row } from "~/components/Row";
import { SubmitButton } from "~/components/SubmitButton";
import { TextField } from "~/components/TextField";
import { TextInput } from "~/components/TextInput";
import { useTranslation } from "~/hooks/useTranslation";
import { z } from "zod";
import { errorsForPath, parseFormData } from "~/utils";
import { useLocale } from "~/hooks/useLocale";
import { DateInput } from "~/components/DateInput";
import { useState } from "react";

const AddressForm = z.object({
  street: z.string(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
});

const Int = z.string().regex(/^\d+$/).transform(Number);

const Birthday = z.object({
  day: Int,
  month: Int,
  year: Int,
});
const Participant = z.object({
  fullName: z.string(),
  birthday: Birthday,
  address: AddressForm,
});

type Participant = z.TypeOf<typeof Participant>;

function participantIsEmpty(p: Participant): boolean {
  if (typeof p.fullName === "string") {
    return p.fullName.trim().length === 0;
  } else {
    return true;
  }
}

const Form = z.object({
  email: z.string().email(),
  participants: z.preprocess((participants) => {
    if (Array.isArray(participants)) {
      return participants.filter((participant) => {
        return !participantIsEmpty(participant);
      });
    } else {
      return participants;
    }
  }, z.array(Participant)),
  comment: z.string(),
});

export const action: ActionFunction = async ({ params, context, request }) => {
  const formData = await request.formData();

  const parsedFormData = parseFormData(formData);

  const result = Form.safeParse(parsedFormData);

  if (result.success) {
    await context.app.registerPerson(result.data.email);

    return redirect("success");
  } else {
    return json({ errors: result.error.issues, values: parsedFormData });
  }
};

interface ParticipantFormProps {
  index: number;
  defaultParticipant?: Participant;
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
          defaultValue={props.defaultParticipant?.fullName}
        />
        <DateInput
          label={t("birthdayField")}
          name={withPrefix("birthday")}
          defaultDate={
            props.defaultParticipant
              ? [
                  props.defaultParticipant.birthday.day,
                  props.defaultParticipant.birthday.month,
                  props.defaultParticipant.birthday.year,
                ]
              : undefined
          }
        />
        <TextInput
          label={t("streetField")}
          name={withPrefix("address.street")}
          defaultValue={props.defaultParticipant?.address?.street}
        />
        <TextInput
          label={t("postalCodeField")}
          name={withPrefix("address.postalCode")}
          defaultValue={props.defaultParticipant?.address?.postalCode}
        />
        <TextInput
          label={t("cityField")}
          name={withPrefix("address.city")}
          defaultValue={props.defaultParticipant?.address?.city}
        />
        <TextInput
          label={t("countryField")}
          name={withPrefix("address.country")}
          defaultValue={props.defaultParticipant?.address?.country}
        />
      </Col>
    </Row>
  );
}

export default function NewRegistration() {
  const { dateTimeFormatter } = useLocale();

  const [participantCount, setParticipantCount] = useState(1);

  const t = useTranslation();
  // TODO: Typing
  const actionData = useActionData();

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
                Weitere Teilnehmer*innen anmelden
              </a>
            </div>
            <br />
            <br />

            <TextField label={t("commentField")} name="comment" />
            <SubmitButton title={t("submitRegister")} />
          </form>
        </Col>
      </Row>
    </>
  );
}
