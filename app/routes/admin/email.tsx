import { ActionFunction, LoaderFunction } from "@remix-run/node";
import { App } from "~/domain/app.server";
import { whenAuthorized } from "~/session";
import * as z from "zod";
import { parseFormData } from "~/utils";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { Alert, Button, Grid, Stack, TextField } from "@mui/material";
import { useState } from "react";

const LoaderDataSchema = z.object({
  registrations: z.array(
    z.object({
      registrationId: z.string(),
      email: z.string(),
    })
  ),
});

type LoaderData = z.TypeOf<typeof LoaderDataSchema>;

export const loader: LoaderFunction = async ({ request, context }) => {
  return whenAuthorized<LoaderData>(request, () => {
    const app = context.app as App;

    return { registrations: app.getAllActualRegistrations() };
  });
};

const ActionSchema = z.discriminatedUnion("type", [
  z.object({
    emailBody: z.string(),
    emailSubject: z.string(),
    registrationIds: z.string(),
    type: z.literal("live"),
  }),
  z.object({
    emailBody: z.string(),
    emailSubject: z.string(),
    toAddress: z.string(),
    type: z.literal("test"),
  }),
]);

export const action: ActionFunction = async ({ request, context }) => {
  const app = context.app as App;
  const formData = parseFormData(await request.formData());
  const data = ActionSchema.parse(formData);

  switch (data.type) {
    case "live":
      await app.sendGenericEmail(
        data.registrationIds.split(","),
        data.emailSubject,
        data.emailBody
      );
      break;
    case "test":
      await app.sendGenericTestEmail(
        data.toAddress,
        data.emailSubject,
        data.emailBody
      );
      break;
  }

  return { success: true };
};

export default function Email() {
  const data = useLoaderData<LoaderData>();
  const registrations = data.registrations;

  const [emailBody, setEmailBody] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [testMailAddress, setTestMailAddress] = useState<string>("");
  const fetcher = useFetcher();

  const handleSend = () => {
    fetcher.submit(
      {
        registrationIds: registrations.map((r) => r.registrationId).join(","),
        emailSubject,
        emailBody,
        type: "live",
      },
      { method: "post" }
    );
  };

  const handleTestSend = () => {
    fetcher.submit(
      {
        toAddress: testMailAddress,
        emailSubject,
        emailBody,
        type: "test",
      },
      { method: "post" }
    );
  };

  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      {fetcher.data && fetcher.data.success === true && (
        <Alert severity="success">E-Mails erfolgreich verschickt.</Alert>
      )}
      <ul>
        {data.registrations.map((r) => (
          <li key={r.registrationId}>{r.email}</li>
        ))}
      </ul>
      <TextField
        fullWidth
        label="Subject"
        value={emailSubject}
        onChange={(e) => setEmailSubject(e.target.value)}
      />
      <TextField
        fullWidth
        multiline
        label="Body"
        value={emailBody}
        onChange={(e) => setEmailBody(e.target.value)}
      />
      <Grid container spacing={2}>
        <Grid item md={6}>
          <TextField
            fullWidth
            label="Test-Empfänger"
            value={testMailAddress}
            onChange={(e) => setTestMailAddress(e.target.value)}
          />
        </Grid>
        <Grid item md={6}>
          <Button
            variant="outlined"
            onClick={handleTestSend}
            fullWidth
            disabled={fetcher.state === "submitting"}
          >
            Test-Mail an {testMailAddress} senden
          </Button>
        </Grid>
      </Grid>
      <Button
        variant="contained"
        onClick={handleSend}
        disabled={fetcher.state === "submitting"}
      >
        Senden
      </Button>
    </Stack>
  );
}
