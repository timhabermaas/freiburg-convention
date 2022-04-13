import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
  useActionData,
  useLoaderData,
} from "remix";
import { useTranslation } from "~/hooks/useTranslation";
import { z } from "zod";
import {
  errorsForPath,
  finalPriceModifier,
  getObject,
  getValue,
  NestedParams,
  parseFormData,
} from "~/utils";
import { useLocale } from "~/hooks/useLocale";
import { DateInput } from "~/components/DateInput";
import { useEffect, useState } from "react";
import { Accommodation, Address, Day, TShirtSize } from "~/domain/types";
import { TICKETS } from "~/domain/tickets";
import { App } from "~/domain/app";
import * as i18n from "~/i18n";
import {
  Grid,
  Typography,
  TextField,
  Button,
  Stack,
  FormControl,
  RadioGroup,
  FormLabel,
  FormControlLabel,
  Radio,
  FormGroup,
  Switch,
  Alert,
  Divider,
  IconButton,
  FormHelperText,
  Link,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { TicketCard } from "~/components/TicketCard";
import { CountrySelect } from "~/components/CountrySelect";

const AddressSchema: z.ZodSchema<Address> = z.object({
  street: z.string().nonempty(),
  postalCode: z.string().nonempty(),
  city: z.string().nonempty(),
  country: z.string().nonempty(),
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

const TShirtSizeSchema: z.ZodSchema<TShirtSize, z.ZodTypeDef, unknown> =
  z.union([z.literal("S"), z.literal("M"), z.literal("L"), z.literal("XL")]);

const ParticipantSchema = z.object({
  fullName: z.string().nonempty(),
  birthday: DaySchema,
  address: AddressSchema,
  ticketId: z.string(),
  priceModifier: z.optional(
    z.union([z.literal("Supporter"), z.literal("Cheaper")])
  ),
  accommodation: AccommodationSchema,
  tShirtSize: TShirtSizeSchema.optional(),
});

const Form = z.object({
  email: z.string().email(),
  participants: z.array(ParticipantSchema).nonempty(),
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

export const loader: LoaderFunction = ({ context }) => {
  const app = context.app as App;

  return {
    availableAccommodations: app.getAvailableAccommodations(),
    conventionFull: app.isConventionFull(),
  };
};

interface ParticipantFormProps {
  index: number;
  errors?: z.ZodIssue[];
  defaultParticipant?: NestedParams;
  availableAccommodations: readonly Accommodation[];
  onRemoveClick?: () => void;
}

function ParticipantForm(props: ParticipantFormProps) {
  const { locale } = useLocale();
  const [tShirtSelected, setTShirtSelected] = useState<boolean>(
    getValue(props.defaultParticipant ?? {}, "tShirtSize") !== undefined
  );
  const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>(
    undefined
  );
  const [supporterOrCheaper, setSupporterOrCheaper] = useState<
    "Supporter" | "Cheaper" | undefined
  >(
    getValue(props.defaultParticipant ?? {}, "priceModifier") === "Supporter"
      ? "Supporter"
      : getValue(props.defaultParticipant ?? {}, "priceModifier") === "Cheaper"
      ? "Cheaper"
      : undefined
  );
  const priceModifier =
    supporterOrCheaper === "Supporter"
      ? 1000
      : supporterOrCheaper === "Cheaper"
      ? -1000
      : 0;

  useEffect(() => {
    setSelectedTicketId(getValue(props.defaultParticipant ?? {}, "ticketId"));
  }, [getValue(props.defaultParticipant ?? {}, "ticketId")]);

  const t = useTranslation();
  const withPrefix = (name: string): string =>
    `participants.${props.index}.${name}`;

  return (
    <Grid container>
      <Grid
        container
        item
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Grid item>
          <Typography variant="h3" component="h4">
            {t(i18n.participantHeader(props.index + 1))}
          </Typography>
        </Grid>
        {props.onRemoveClick && (
          <Grid item>
            <IconButton color="error" onClick={props.onRemoveClick}>
              <CloseIcon />
            </IconButton>
          </Grid>
        )}
      </Grid>
      <Grid container item xs={12} md={8} spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            name={withPrefix("fullName")}
            label={t(i18n.fullNameField)}
            defaultValue={getValue(props.defaultParticipant ?? {}, "fullName")}
            error={
              props.errors &&
              errorsForPath(withPrefix("fullName"), props.errors, locale)
                .length > 0
            }
            helperText={
              props.errors
                ? errorsForPath(withPrefix("fullName"), props.errors, locale)
                : undefined
            }
          />
        </Grid>
        <Grid item xs={12}>
          <DateInput
            label={t(i18n.birthdayField)}
            name={withPrefix("birthday")}
            defaultDate={getObject(props.defaultParticipant ?? {}, "birthday")}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            name={withPrefix("address.street")}
            label={t(i18n.streetField)}
            defaultValue={getValue(
              props.defaultParticipant ?? {},
              "address",
              "street"
            )}
            error={
              props.errors &&
              errorsForPath(withPrefix("address.street"), props.errors, locale)
                .length > 0
            }
            helperText={
              props.errors
                ? errorsForPath(
                    withPrefix("address.street"),
                    props.errors,
                    locale
                  )
                : undefined
            }
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            name={withPrefix("address.postalCode")}
            label={t(i18n.postalCodeField)}
            defaultValue={getValue(
              props.defaultParticipant ?? {},
              "address",
              "postalCode"
            )}
            error={
              props.errors &&
              errorsForPath(
                withPrefix("address.postalCode"),
                props.errors,
                locale
              ).length > 0
            }
            helperText={
              props.errors
                ? errorsForPath(
                    withPrefix("address.postalCode"),
                    props.errors,
                    locale
                  )
                : undefined
            }
          />
        </Grid>
        <Grid item xs={12} sm={8}>
          <TextField
            fullWidth
            name={withPrefix("address.city")}
            label={t(i18n.cityField)}
            defaultValue={getValue(
              props.defaultParticipant ?? {},
              "address",
              "city"
            )}
            error={
              props.errors &&
              errorsForPath(withPrefix("address.city"), props.errors, locale)
                .length > 0
            }
            helperText={
              props.errors
                ? errorsForPath(
                    withPrefix("address.city"),
                    props.errors,
                    locale
                  )
                : undefined
            }
          />
        </Grid>
        <Grid item xs={12}>
          <CountrySelect
            name={withPrefix("address.country")}
            label={t(i18n.countryField)}
            locale={locale}
            defaultValue={getValue(
              props.defaultParticipant ?? {},
              "address",
              "country"
            )}
            error={
              props.errors &&
              errorsForPath(withPrefix("address.country"), props.errors, locale)
                .length > 0
            }
            helperText={
              props.errors
                ? errorsForPath(
                    withPrefix("address.country"),
                    props.errors,
                    locale
                  )
                : undefined
            }
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl
            error={
              props.errors &&
              errorsForPath(withPrefix("accommodation"), props.errors, locale)
                .length > 0
            }
          >
            <FormLabel>{t(i18n.accommodationField)}</FormLabel>
            <RadioGroup
              defaultValue={getValue(
                props.defaultParticipant ?? {},
                "accommodation"
              )}
              name={withPrefix("accommodation")}
            >
              {props.availableAccommodations.map((accommodation) => (
                <FormControlLabel
                  value={accommodation}
                  control={<Radio />}
                  label={t(i18n.accommodationFieldType(accommodation))}
                  key={accommodation}
                />
              ))}
            </RadioGroup>
            {props.errors &&
              errorsForPath(
                withPrefix("accommodation"),
                props.errors,
                locale
              ) && (
                <FormHelperText>
                  {errorsForPath(
                    withPrefix("accommodation"),
                    props.errors,
                    locale
                  )}
                </FormHelperText>
              )}
          </FormControl>
        </Grid>
      </Grid>
      <Grid item xs={12} sx={{ mb: 2 }}>
        <Typography variant="h4" component="h5">
          {t(i18n.ticketField)}
        </Typography>
      </Grid>
      <Grid item xs={12} sx={{ mb: 3 }}>
        <FormControl component="fieldset" variant="standard">
          <FormLabel component="legend" sx={{ mb: 1 }}>
            {t(i18n.transformToSupportSoli)}
          </FormLabel>
          <Alert severity="info" sx={{ mb: 1 }}>
            {t(i18n.soliNote)}
          </Alert>
          <FormGroup>
            <FormControlLabel
              control={<Switch checked={supporterOrCheaper === "Supporter"} />}
              label={`Supporter (+${i18n.formatCurrency(1000, "EUR", locale)})`}
              onChange={(_e, checked) =>
                checked
                  ? setSupporterOrCheaper("Supporter")
                  : setSupporterOrCheaper(undefined)
              }
            />
            <FormControlLabel
              control={<Switch checked={supporterOrCheaper === "Cheaper"} />}
              label={`Soli (${i18n.formatCurrency(-1000, "EUR", locale)})`}
              onChange={(_e, checked) =>
                checked
                  ? setSupporterOrCheaper("Cheaper")
                  : setSupporterOrCheaper(undefined)
              }
            />
          </FormGroup>
        </FormControl>
        {supporterOrCheaper && (
          <input
            type="hidden"
            value={supporterOrCheaper}
            name={withPrefix("priceModifier")}
          />
        )}
      </Grid>
      <Grid container item xs={12} spacing={3} sx={{ mb: 2 }}>
        {TICKETS.map((ticket) => (
          <Grid item key={ticket.ticketId} xs={12} sm={6} md={4}>
            <TicketCard
              priceModifier={finalPriceModifier(ticket, priceModifier)}
              ticket={ticket}
              locale={locale}
              selected={ticket.ticketId === selectedTicketId}
              name={withPrefix("ticketId")}
              onClick={() => setSelectedTicketId(ticket.ticketId)}
            />
          </Grid>
        ))}
        {selectedTicketId && (
          <input
            type="hidden"
            value={selectedTicketId}
            name={withPrefix("ticketId")}
          />
        )}
      </Grid>
      <FormControl
        error={
          props.errors &&
          errorsForPath(withPrefix("ticketId"), props.errors, locale).length > 0
        }
      >
        {props.errors &&
          errorsForPath(withPrefix("ticketId"), props.errors, locale) && (
            <FormHelperText>
              {errorsForPath(withPrefix("ticketId"), props.errors, locale)}
            </FormHelperText>
          )}
      </FormControl>
      <Grid item xs={12} sx={{ mb: 3, mt: 3 }}>
        <FormControl component="fieldset" variant="standard">
          <FormLabel component="legend">{t(i18n.tShirtField)}</FormLabel>
          <FormGroup>
            <FormControlLabel
              label={t(i18n.yes)}
              control={<Switch checked={tShirtSelected} />}
              onChange={(_e, checked) => setTShirtSelected(checked)}
            />
          </FormGroup>
        </FormControl>
      </Grid>
      {tShirtSelected && (
        <Grid item xs={12} sx={{ pl: 2, mb: 3 }}>
          <FormControl>
            <FormLabel>{t(i18n.tShirtSizeField)}</FormLabel>
            <RadioGroup
              row
              defaultValue={getValue(
                props.defaultParticipant ?? {},
                "tShirtSize"
              )}
              name={withPrefix("tShirtSize")}
            >
              {["S", "M", "L", "XL"].map((size) => (
                <FormControlLabel
                  value={size}
                  control={<Radio />}
                  label={size}
                  key={size}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Grid>
      )}
    </Grid>
  );
}

export default function NewRegistration() {
  const { dateFormatter, locale } = useLocale();

  const t = useTranslation();
  // TODO: Typing
  const actionData = useActionData();
  const data = useLoaderData();

  const [participantCount, setParticipantCount] = useState<number>(
    actionData?.values?.participants ? actionData.values.participants.length : 1
  );

  return (
    <>
      <Grid container justifyContent="center" spacing={1} sx={{ mb: 3 }}>
        <Grid item>
          <Typography variant="h4" component="h1" textAlign="center">
            {t(i18n.registrationTitle)}
          </Typography>
        </Grid>
        <Grid item>
          <Typography
            variant="h5"
            component="h2"
            color="text.secondary"
            textAlign="center"
          >
            {dateFormatter.format(Date.parse("2022-05-26"))} –{" "}
            {dateFormatter.format(Date.parse("2022-05-29"))}
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
            href="https://jonglieren-in-freiburg.de/?page_id=43"
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
