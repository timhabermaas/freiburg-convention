import { ActionFunction, json, redirect } from "remix";
import { SubmitButton } from "~/components/SubmitButton";
import { TextInput } from "~/components/TextInput";
import { useTranslation } from "~/hooks/useTranslation";

const badRequest = () => json({}, { status: 400 });

export const action: ActionFunction = async ({ params, context, request }) => {
  const formData = await request.formData();
  const email = formData.get("email");

  if (typeof email !== "string") {
    return badRequest();
  }

  await context.app.registerPerson(email);

  return redirect("success");
};

export default function NewRegistration() {
  const t = useTranslation();

  return (
    <>
      <div className="mb-3"></div>
      <div className="row mb-4">
        <div className="col-md-12">
          <h1 className="text-center">{t("registrationTitle")}</h1>
          <h4 className="text-center">
            <small className="text-muted">26.05.2022 – 29.05.2022</small>
          </h4>
        </div>
      </div>
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <form method="post">
            <TextInput label={t("email")} name="email" autoComplete="email" />
            <SubmitButton title={t("submitRegister")} />
          </form>
        </div>
      </div>
    </>
  );
}
