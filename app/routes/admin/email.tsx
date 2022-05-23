import { ActionFunction, LoaderFunction } from "@remix-run/node";
import { App } from "~/domain/app";
import { whenAuthorized } from "~/session";
import * as z from "zod";
import {
  AccommodationSchema,
  AgeCategorySchema,
  DaySchema,
} from "~/domain/events";
import { isoDateString, PaidStatusSchema, parseFormData } from "~/utils";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { Alert, Button, Stack, TextField } from "@mui/material";
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

const ActionSchema = z.object({
  emailBody: z.string(),
  emailSubject: z.string(),
  registrationIds: z.string(),
});

export const action: ActionFunction = async ({ request, context }) => {
  const app = context.app as App;
  const formData = parseFormData(await request.formData());
  const data = ActionSchema.parse(formData);
  console.log(data);

  await app.sendGenericEmail(
    data.registrationIds.split(","),
    data.emailSubject,
    data.emailBody
  );

  return { success: true };
};

export default function Email() {
  const data = useLoaderData<LoaderData>();
  const registrations = data.registrations;

  const [emailBody, setEmailBody] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const fetcher = useFetcher();

  const handleSend = () => {
    fetcher.submit(
      {
        registrationIds: registrations.map((r) => r.registrationId).join(","),
        emailSubject,
        emailBody,
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
      <Button variant="contained" onClick={handleSend}>
        Senden
      </Button>
    </Stack>
  );
}
