import { useState } from "react";
import { z } from "zod";
import { errorsForPath, getObject, getValue, NestedParams } from "~/utils";
import * as i18n from "~/i18n";
import {
  Accommodation,
  AgeCategory,
  SupporterCategory,
  T_SHIRT_SIZES,
} from "~/domain/types";
import {
  Grid,
  Typography,
  TextField,
  Button,
  FormControl,
  RadioGroup,
  FormLabel,
  FormControlLabel,
  Radio,
  FormGroup,
  Switch,
  Alert,
  IconButton,
  FormHelperText,
  CardContent,
  CardActions,
  Card,
  CardHeader,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/StarBorder";
import { useLocale } from "~/hooks/useLocale";
import { useTranslation } from "~/hooks/useTranslation";
import { price } from "~/domain/tickets";
import { ChipInput } from "~/components/ChipInput";
import { CountrySelect } from "~/components/CountrySelect";
import { DateInput } from "~/components/DateInput";
import { useEventConfig } from "~/hooks/useEventConfig";

interface ParticipantFormProps {
  index: number;
  errors?: z.ZodIssue[];
  defaultParticipant?: NestedParams;
  availableAccommodations: readonly Accommodation[];
  onRemoveClick?: () => void;
}

export function ParticipantForm(props: ParticipantFormProps) {
  const { locale } = useLocale();
  const eventConfig = useEventConfig();
  const [accommodation, setAccommodation] = useState<Accommodation | null>(
    getValue(props.defaultParticipant ?? {}, "accommodation") === "gym"
      ? "gym"
      : getValue(props.defaultParticipant ?? {}, "accommodation") === "tent"
      ? "tent"
      : getValue(props.defaultParticipant ?? {}, "accommodation") ===
        "selfOrganized"
      ? "selfOrganized"
      : null
  );
  const [age, setAge] = useState<AgeCategory | null>(
    getValue(props.defaultParticipant ?? {}, "ageCategory") === "Baby"
      ? "Baby"
      : getValue(props.defaultParticipant ?? {}, "ageCategory") === "Child"
      ? "Child"
      : getValue(props.defaultParticipant ?? {}, "ageCategory") ===
        "OlderThan12"
      ? "OlderThan12"
      : null
  );
  const [ticketId, setTicketId] = useState<string | null>(
    getValue(props.defaultParticipant ?? {}, "ticketId") ?? null
  );
  const ticket = eventConfig.tickets.find((t) => t.id === ticketId) ?? null;
  const [tShirtSelected, setTShirtSelected] = useState<boolean>(
    getValue(props.defaultParticipant ?? {}, "tShirtSize") !== undefined
  );
  const [supporterCategory, setSupporterCategory] = useState<SupporterCategory>(
    getValue(props.defaultParticipant ?? {}, "supporterCategory") ===
      "Supporter"
      ? "Supporter"
      : getValue(props.defaultParticipant ?? {}, "supporterCategory") ===
        "Cheaper"
      ? "Cheaper"
      : "Normal"
  );

  const t = useTranslation();
  const withPrefix = (name: string): string =>
    `participants.${props.index}.${name}`;

  let tiers: {
    title: string;
    price: number | null;
    description: string[];
    buttonText: string;
    supporterCategory: SupporterCategory;
    selected: boolean;
  }[] = [
    {
      title: t(i18n.regularTicketTitle),
      price: age && ticket && price(age, ticket.price, "Normal"),
      description: eventConfig.ticketDescription[locale],
      buttonText: t(i18n.select),
      supporterCategory: "Normal",
      selected: supporterCategory === "Normal",
    },
  ];

  if (eventConfig.soliTicket) {
    tiers.unshift({
      title: t(i18n.soliTicketTitle),
      price: age && ticket && price(age, ticket.price, "Cheaper"),
      description: eventConfig.ticketDescription[locale],
      buttonText: t(i18n.select),
      supporterCategory: "Cheaper",
      selected: supporterCategory === "Cheaper",
    });
  }

  if (eventConfig.supporterTicket) {
    tiers.push({
      title: t(i18n.supporterTicketTitle),
      price: age && ticket && price(age, ticket.price, "Supporter"),
      description: eventConfig.ticketDescription[locale],
      buttonText: t(i18n.select),
      supporterCategory: "Supporter",
      selected: supporterCategory === "Supporter",
    });
  }

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
            required
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
      </Grid>
      <Grid item xs={12} sx={{ mb: 2 }}>
        <FormControl
          fullWidth
          error={
            props.errors &&
            errorsForPath(withPrefix("accommodation"), props.errors, locale)
              .length > 0
          }
        >
          <FormLabel required sx={{ mb: 1 }}>
            {t(i18n.accommodationField)}
          </FormLabel>
          <Grid
            container
            direction={{ sm: "row", xs: "column" }}
            spacing={2}
            justifyContent={{ sm: "center" }}
          >
            {props.availableAccommodations.map((acc) => (
              <Grid item key={acc}>
                <ChipInput
                  label={t(i18n.accommodationFieldType(acc))}
                  value={acc}
                  onClick={() => setAccommodation(acc)}
                  currentValue={accommodation}
                />
              </Grid>
            ))}
            {accommodation && (
              <input
                type="hidden"
                value={accommodation}
                name={withPrefix("accommodation")}
              />
            )}
          </Grid>
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
      <Grid item xs={12} sx={{ mb: 2 }}>
        <FormControl
          fullWidth
          error={
            props.errors &&
            errorsForPath(withPrefix("ageCategory"), props.errors, locale)
              .length > 0
          }
        >
          <FormLabel required sx={{ mb: 1 }}>
            {t(i18n.ageField)}
          </FormLabel>
          <Grid
            container
            direction={{ sm: "row", xs: "column" }}
            spacing={2}
            justifyContent={{ sm: "center" }}
          >
            <Grid item>
              <ChipInput
                label={t(i18n.translateAgeCategory("OlderThan12"))}
                value={"OlderThan12"}
                onClick={() => setAge("OlderThan12")}
                currentValue={age}
              />
            </Grid>
            <Grid item>
              <ChipInput
                label={t(i18n.translateAgeCategory("Child"))}
                value={"Child"}
                currentValue={age}
                onClick={() => {
                  setAge("Child");
                }}
              />
            </Grid>
            <Grid item>
              <ChipInput
                label={t(i18n.translateAgeCategory("Baby"))}
                value={"Baby"}
                currentValue={age}
                onClick={() => {
                  setAge("Baby");
                }}
              />
            </Grid>
            {age && (
              <input
                type="hidden"
                value={age}
                name={withPrefix("ageCategory")}
              />
            )}
          </Grid>
          {props.errors &&
            errorsForPath(withPrefix("ageCategory"), props.errors, locale) && (
              <FormHelperText>
                {errorsForPath(withPrefix("ageCategory"), props.errors, locale)}
              </FormHelperText>
            )}
        </FormControl>
      </Grid>
      <Grid item xs={12} sx={{ mb: 2 }}>
        <FormControl
          fullWidth
          error={
            props.errors &&
            errorsForPath(withPrefix("ticketId"), props.errors, locale).length >
              0
          }
        >
          <FormLabel required sx={{ mb: 1 }}>
            {t(i18n.durationField)}
          </FormLabel>
          <Grid
            container
            direction={{ sm: "row", xs: "column" }}
            spacing={2}
            justifyContent={{ sm: "center" }}
          >
            {eventConfig.tickets.map((ticket) => (
              <Grid item key={ticket.id}>
                <ChipInput
                  label={t(
                    i18n.translateTicketDuration(ticket.from, ticket.to)
                  )}
                  value={ticket.id}
                  currentValue={ticketId}
                  onClick={() => {
                    setTicketId(ticket.id);
                  }}
                />
              </Grid>
            ))}
            {ticketId && (
              <input
                type="hidden"
                value={ticketId}
                name={withPrefix("ticketId")}
              />
            )}
          </Grid>
          {props.errors &&
            errorsForPath(withPrefix("ticketId"), props.errors, locale) && (
              <FormHelperText>
                {errorsForPath(withPrefix("ticketId"), props.errors, locale)}
              </FormHelperText>
            )}
        </FormControl>
      </Grid>
      <Grid item xs={12} sx={{ mb: 1 }}>
        <Box sx={{ mb: 2 }}>
          <FormLabel required>{t(i18n.ticketField)}</FormLabel>
        </Box>
        {eventConfig.soliTicket && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t(i18n.soliNote)}
          </Alert>
        )}
        <Grid container spacing={5} alignItems="flex-start" sx={{ mb: 1 }}>
          {tiers.map((tier) => (
            <Grid item key={tier.title} xs={12} sm={6} md={4}>
              <Card elevation={3} variant="elevation">
                <CardHeader
                  title={tier.title}
                  titleTypographyProps={{
                    align: "center",
                    color: tier.selected ? "primary.contrastText" : "primary",
                  }}
                  action={tier.title === "Pro" ? <StarIcon /> : null}
                  subheaderTypographyProps={{
                    align: "center",
                  }}
                  sx={{
                    backgroundColor: tier.selected ? "primary.main" : undefined,
                  }}
                />
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "baseline",
                      mb: 2,
                    }}
                  >
                    <Typography
                      component="h2"
                      variant="h3"
                      color="text.primary"
                    >
                      {tier.price !== null
                        ? i18n.formatCurrency(tier.price, "EUR", locale)
                        : "–"}
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    {tier.description.map((line) => (
                      <Typography
                        color="textSecondary"
                        variant="subtitle1"
                        component="p"
                        key={line}
                      >
                        {line}
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant={tier.selected ? "contained" : "outlined"}
                    onClick={() => {
                      setSupporterCategory(tier.supporterCategory);
                    }}
                  >
                    {tier.buttonText}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        <input
          type="hidden"
          value={supporterCategory}
          name={withPrefix("supporterCategory")}
        />
      </Grid>
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
              {T_SHIRT_SIZES.map((size) => (
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
