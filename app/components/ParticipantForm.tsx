import { useState } from "react";
import { z } from "zod";
import { errorsForPath, getObject, getValue, NestedParams } from "~/utils";
import * as i18n from "~/i18n";
import {
  Accommodation,
  AgeCategory,
  Duration,
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

interface ParticipantFormProps {
  index: number;
  errors?: z.ZodIssue[];
  defaultParticipant?: NestedParams;
  availableAccommodations: readonly Accommodation[];
  onRemoveClick?: () => void;
}

export function ParticipantForm(props: ParticipantFormProps) {
  const { locale } = useLocale();
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
  const [duration, setDuration] = useState<Duration | null>(
    getValue(props.defaultParticipant ?? {}, "duration") === "Fr-Mo"
      ? "Fr-Mo"
      : getValue(props.defaultParticipant ?? {}, "duration") === "Fr-Su"
      ? "Fr-Su"
      : getValue(props.defaultParticipant ?? {}, "duration") === "Sa-Mo"
      ? "Sa-Mo"
      : null
  );
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

  const tiers = [
    {
      title: t(i18n.soliTicketTitle),
      price: age && duration && price(age, duration, "Cheaper"),
      description: i18n.ticketFeatures[locale],
      buttonText: t(i18n.select),
      supporterCategory: "Cheaper",
      selected: supporterCategory === "Cheaper",
    },
    {
      title: t(i18n.regularTicketTitle),
      price: age && duration && price(age, duration, "Normal"),
      description: i18n.ticketFeatures[locale],
      buttonText: t(i18n.select),
      supporterCategory: "Normal",
      selected: supporterCategory === "Normal",
    },
    {
      title: t(i18n.supporterTicketTitle),
      price: age && duration && price(age, duration, "Supporter"),
      description: i18n.ticketFeatures[locale],
      buttonText: t(i18n.select),
      supporterCategory: "Supporter",
      selected: supporterCategory === "Supporter",
    },
  ] as const;

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
          <FormLabel sx={{ mb: 1 }}>{t(i18n.accommodationField)}</FormLabel>
          <Grid
            container
            direction={{ sm: "row", xs: "column" }}
            spacing={2}
            justifyContent={{ sm: "center" }}
          >
            {props.availableAccommodations.map((acc) => (
              <Grid item>
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
          <FormLabel sx={{ mb: 1 }}>{t(i18n.ageField)}</FormLabel>
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
            errorsForPath(withPrefix("duration"), props.errors, locale).length >
              0
          }
        >
          <FormLabel sx={{ mb: 1 }}>{t(i18n.durationField)}</FormLabel>
          <Grid
            container
            direction={{ sm: "row", xs: "column" }}
            spacing={2}
            justifyContent={{ sm: "center" }}
          >
            <Grid item>
              <ChipInput
                label={t(i18n.translateDurationCategory("Fr-Mo"))}
                value={"Fr-Mo"}
                currentValue={duration}
                onClick={() => {
                  setDuration("Fr-Mo");
                }}
              />
            </Grid>
            <Grid item>
              <ChipInput
                label={t(i18n.translateDurationCategory("Fr-Su"))}
                value={"Fr-Su"}
                currentValue={duration}
                onClick={() => {
                  setDuration("Fr-Su");
                }}
              />
            </Grid>
            <Grid item>
              <ChipInput
                label={t(i18n.translateDurationCategory("Sa-Mo"))}
                value={"Sa-Mo"}
                currentValue={duration}
                onClick={() => {
                  setDuration("Sa-Mo");
                }}
              />
            </Grid>
            {duration && (
              <input
                type="hidden"
                value={duration}
                name={withPrefix("duration")}
              />
            )}
          </Grid>
          {props.errors &&
            errorsForPath(withPrefix("duration"), props.errors, locale) && (
              <FormHelperText>
                {errorsForPath(withPrefix("duration"), props.errors, locale)}
              </FormHelperText>
            )}
        </FormControl>
      </Grid>
      <Grid item xs={12} sx={{ mb: 1 }}>
        <Box sx={{ mb: 2 }}>
          <FormLabel>{t(i18n.ticketField)}</FormLabel>
        </Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          {t(i18n.soliNote)}
        </Alert>
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
