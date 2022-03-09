import { ActionFunction, json, redirect, useActionData } from "remix";
import { Col } from "~/components/Col";
import { Row } from "~/components/Row";
import { SubmitButton } from "~/components/SubmitButton";
import { TextField } from "~/components/TextField";
import { TextInput } from "~/components/TextInput";
import { useTranslation } from "~/hooks/useTranslation";
import { z } from "zod";
import { parseFormData } from "~/utils";
import { useLocale } from "~/hooks/useLocale";

const Form = z.object({
  email: z.string().email(),
  participant: z.object({ name: z.string() }),
});

function errorsForPath(path: string, issues: z.ZodIssue[]): string[] {
  const result = [];

  for (const issue of issues) {
    if (issue.path.join(".") === path) {
      result.push(issue.message + " " + issue.code);
    }
  }

  return result;
}

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
}

function ParticipantForm(props: ParticipantFormProps) {
  const t = useTranslation();

  return (
    <Row>
      <Col size="md" cols={12}></Col>
      <h4>{t("participantHeader", { index: props.index.toString() })}</h4>
    </Row>
  );
}

export default function NewRegistration() {
  const { dateTimeFormatter } = useLocale();

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
              defaultValue={actionData?.values.email}
              errorMessages={
                actionData?.errors
                  ? errorsForPath("email", actionData?.errors)
                  : undefined
              }
            />
            <TextInput
              label={t("fullNameField")}
              name="participant.name"
              defaultValue={actionData?.values.participant.name}
              errorMessages={
                actionData?.errors
                  ? errorsForPath("participant.name", actionData?.errors)
                  : undefined
              }
            />
            <TextInput label={"Full name"} name="bot" hidden />

            {[1, 2, 3].map((i) => (
              <ParticipantForm key={i} index={i}></ParticipantForm>
            ))}

            <TextField label={t("commentField")} name="comment" />
            <SubmitButton title={t("submitRegister")} />
          </form>
        </Col>
      </Row>
    </>
  );
}
