import { useActionData } from "@remix-run/react";
import { json, ActionFunction, redirect } from "@remix-run/node";
import { Col } from "~/components/Col";
import { Row } from "~/components/Row";
import { SubmitButton } from "~/components/SubmitButton";
import { TextInput } from "~/components/TextInput";
import * as z from "zod";
import { errorsForPath, parseFormData } from "~/utils";
import { commitSession, getSession } from "~/session";
import { CONFIG } from "~/config.server";

const LoginForm = z.object({
  login: z.string().nonempty(),
  password: z.string().nonempty(),
});

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const parsedFormData = parseFormData(formData);
  const result = LoginForm.safeParse(parsedFormData);

  if (result.success) {
    if (
      result.data.login === "admin" &&
      result.data.password === CONFIG.adminPassword
    ) {
      const session = await getSession();
      session.set("isLoggedIn", true);
      return redirect("/admin/registrations", {
        headers: { "Set-Cookie": await commitSession(session) },
      });
    } else {
      return json({ errors: [] });
    }
  } else {
    return json({ errors: result.error.issues });
  }
};

export default function Login() {
  const actionData = useActionData();

  return (
    <>
      <h1>Login</h1>
      <Row>
        <Col cols={12}>
          <form method="post">
            <TextInput
              label="Login"
              name="login"
              errorMessages={
                actionData?.errors
                  ? errorsForPath("login", actionData?.errors, "de")
                  : undefined
              }
            />
            <TextInput
              label="Password"
              name="password"
              isPassword
              errorMessages={
                actionData?.errors
                  ? errorsForPath("password", actionData?.errors, "de")
                  : undefined
              }
            />
            <SubmitButton title="Anmelden" />
          </form>
        </Col>
      </Row>
    </>
  );
}
