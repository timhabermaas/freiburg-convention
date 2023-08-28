import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import { useTranslation } from "~/hooks/useTranslation";
import { z } from "zod";
import { errorsForPath, IntSchema, parseFormData } from "~/utils";
import { useLocale } from "~/hooks/useLocale";
import { useState } from "react";
import {
  Accommodation,
  Address,
  AgeCategory,
  Day,
  Duration,
  SupporterCategory,
  TShirtSize,
} from "~/domain/types";
import { App } from "~/domain/app";
import * as i18n from "~/i18n";
import {
  Grid,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Divider,
  Link,
} from "@mui/material";
import { useActionData, useLoaderData } from "@remix-run/react";
import { ParticipantForm } from "~/components/ParticipantForm";
import { useEventConfig } from "~/hooks/useEventConfig";

const AddressSchema: z.ZodSchema<Address> = z.object({
  street: z.string().nonempty(),
  postalCode: z.string().nonempty(),
  city: z.string().nonempty(),
  country: z.string().nonempty(),
});

const DaySchema: z.ZodSchema<Day, z.ZodTypeDef, unknown> = z
  .object({
    day: IntSchema,
    month: IntSchema,
    year: IntSchema,
  })
  .transform(({ year, month, day }) => new Day(year, month, day));

const AccommodationSchema: z.ZodSchema<Accommodation, z.ZodTypeDef, unknown> =
  z.union([z.literal("gym"), z.literal("tent"), z.literal("selfOrganized")]);

const TShirtSizeSchema: z.ZodSchema<TShirtSize, z.ZodTypeDef, unknown> =
  z.union([z.literal("S"), z.literal("M"), z.literal("L"), z.literal("XL")]);

const AgeCategorySchema: z.ZodSchema<AgeCategory, z.ZodTypeDef, unknown> =
  z.union([z.literal("Baby"), z.literal("Child"), z.literal("OlderThan12")]);

const DurationSchema: z.ZodSchema<Duration, z.ZodTypeDef, unknown> = z.union([
  z.literal("Fr-Mo"),
  z.literal("Fr-Su"),
  z.literal("Sa-Mo"),
]);

const SupporterCategorySchema: z.ZodSchema<
  SupporterCategory,
  z.ZodTypeDef,
  unknown
> = z.union([
  z.literal("Supporter"),
  z.literal("Cheaper"),
  z.literal("Normal"),
]);

const ParticipantSchema = z.object({
  fullName: z.string().nonempty(),
  birthday: DaySchema,
  address: AddressSchema,
  supporterCategory: SupporterCategorySchema,
  priceModifier: z.optional(
    z.union([z.literal("Supporter"), z.literal("Cheaper")])
  ),
  accommodation: AccommodationSchema,
  tShirtSize: TShirtSizeSchema.optional(),
  ageCategory: AgeCategorySchema,
  duration: DurationSchema,
});

const Form = z.object({
  email: z.string().email(),
  participants: z.array(ParticipantSchema).nonempty(),
  comment: z.string(),
  bot: z.string().refine((b) => b.length === 0),
});

export const action: ActionFunction = async ({ context, request }) => {
  const app = context.app as App;
  const formData = await request.formData();

  const parsedFormData = parseFormData(formData);
  console.log(JSON.stringify(parsedFormData));

  const result = Form.safeParse(parsedFormData);
  console.log(JSON.stringify(result));

  if (result.success) {
    await app.register(
      result.data.email,
      result.data.participants,
      result.data.comment
    );

    return redirect("success");
  } else {
    return json({ errors: result.error.issues, values: parsedFormData });
  }
};

export const loader: LoaderFunction = ({ context }) => {
  const app = context.app as App;

  return {
    availableAccommodations: app.getAvailableAccommodations(),
    conventionFull: app.isConventionFull(),
  };
};

export default function NewRegistration() {
  const { dateFormatter, locale } = useLocale();

  const t = useTranslation();
  // TODO: Typing
  const actionData = useActionData();
  const data = useLoaderData();
  const eventConfig = useEventConfig();

  const [participantCount, setParticipantCount] = useState<number>(
    actionData?.values?.participants ? actionData.values.participants.length : 1
  );

  return (
    <>
      <Grid container justifyContent="center" spacing={1} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" textAlign="center">
            {t(i18n.registrationTitle(eventConfig.name))}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography
            variant="h5"
            component="h2"
            color="text.secondary"
            textAlign="center"
          >
            {dateFormatter.format(Date.parse("2023-05-26"))} –{" "}
            {dateFormatter.format(Date.parse("2023-05-29"))}
          </Typography>
        </Grid>
      </Grid>
      {data.conventionFull && (
        <>
          <Alert severity="warning" sx={{ mb: 3 }}>
            {t(i18n.conventionFull)}
          </Alert>
          <Button
            component={Link}
            href={eventConfig.eventHomepage}
            target="_parent"
            variant="contained"
          >
            {t(i18n.backToOverview)}
          </Button>
        </>
      )}
      {!data.conventionFull && (
        <form method="post">
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {actionData?.errors && (
              <Grid item xs={12}>
                <Alert severity="error">{t(i18n.someValidationErrors)}</Alert>
              </Grid>
            )}
            <Grid item xs={12} md={8}>
              <TextField
                label={t(i18n.email)}
                name="email"
                autoComplete="email"
                variant="outlined"
                error={
                  actionData?.errors &&
                  errorsForPath("email", actionData?.errors, locale).length > 0
                }
                helperText={
                  actionData?.errors
                    ? errorsForPath("email", actionData?.errors, locale)
                    : undefined
                }
                defaultValue={actionData?.values?.email}
                fullWidth
              />
            </Grid>
          </Grid>

          <label style={{ display: "none" }} htmlFor="bot-field">
            Full name
          </label>
          <input type="hidden" id="bot-field" name="bot" />

          <Stack spacing={4} sx={{ mb: 2 }} divider={<Divider />}>
            {[...Array(participantCount).keys()].map((i) => (
              <ParticipantForm
                availableAccommodations={data.availableAccommodations}
                key={i}
                index={i}
                defaultParticipant={actionData?.values?.participants?.[i]}
                errors={actionData?.errors}
                onRemoveClick={
                  i !== 0 && i === participantCount - 1
                    ? () => {
                        setParticipantCount((c) => c - 1);
                      }
                    : undefined
                }
              ></ParticipantForm>
            ))}
          </Stack>
          <Grid item xs={12} sx={{ mb: 6 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={(e) => {
                e.preventDefault();
                setParticipantCount((c) => c + 1);
              }}
            >
              {t(i18n.moreParticipants)}
            </Button>
          </Grid>
          <Grid item xs={12} sx={{ mb: 3 }}>
            <TextField
              label={t(i18n.commentField)}
              name="comment"
              autoComplete="comment"
              error={
                actionData?.errors &&
                errorsForPath("comment", actionData?.errors, locale).length > 0
              }
              helperText={
                actionData?.errors
                  ? errorsForPath("comment", actionData?.errors, locale)
                  : undefined
              }
              defaultValue={actionData?.values?.comment}
              multiline
              minRows={3}
              maxRows={10}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" type="submit">
              {t(i18n.submitRegister)}
            </Button>
          </Grid>
        </form>
      )}
    </>
  );
}
