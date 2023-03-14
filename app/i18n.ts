import {
  AgeCategory,
  Cents,
  Accommodation,
  SupporterCategory,
  Duration,
} from "./domain/types";
import { assertNever } from "./utils";

// See https://en.wikipedia.org/wiki/IETF_language_tag for correct codes.
export const Languages = [
  { title: "DE", locale: "de" },
  { title: "EN", locale: "en-US" },
] as const;

export type SupportedLocales = typeof Languages[number]["locale"];

export type LocaleMap = Record<SupportedLocales, string>;

export const email = { "en-US": "Email", de: "E-Mail" };
export const fullNameField = {
  "en-US": "Full Name",
  de: "Name",
};
export const birthdayField = {
  "en-US": "Birthday",
  de: "Geburtstag",
};
export const streetField = {
  "en-US": "Street",
  de: "Straße",
};
export const postalCodeField = {
  "en-US": "Postal Code",
  de: "PLZ",
};
export const cityField = {
  "en-US": "City",
  de: "Stadt",
};
export const countryField = {
  "en-US": "Country",
  de: "Land",
};
export const ticketField = {
  "en-US": "Ticket",
  de: "Festivalticket",
};
export const ageField = {
  "en-US": "Age",
  de: "Alter",
};
export const durationField = {
  "en-US": "Duration",
  de: "Tage",
};
export const accommodationField = {
  "en-US": "Accommodation",
  de: "Unterkunft",
};
export const days = {
  "en-US": "Days",
  de: "Tage",
};
export function accommodationFieldType(accommodation: Accommodation) {
  switch (accommodation) {
    case "gym":
      return {
        "en-US": "Gym",
        de: "Schlafhalle",
      };
    case "tent":
      return {
        "en-US": "Tent",
        de: "Zelt",
      };
    case "selfOrganized":
      return {
        "en-US": "Self-organized (e.g. van, hotel, couchsurfing, ...)",
        de: "Ich sorge für meine eigene Übernachtung (z.B. Van, Hotel, bei Freunden, ...)",
      };
    default:
      assertNever(accommodation);
  }
}
export function accommodationFieldShort(accommodation: Accommodation) {
  switch (accommodation) {
    case "gym":
      return {
        "en-US": "Gym",
        de: "Schlafhalle",
      };
    case "tent":
      return {
        "en-US": "Tent",
        de: "Zelt",
      };
    case "selfOrganized":
      return {
        "en-US": "Self-organized",
        de: "Woanders",
      };
    default:
      assertNever(accommodation);
  }
}
export function accommodationFieldTypeShort(accommodation: Accommodation) {
  switch (accommodation) {
    case "gym":
      return {
        "en-US": "Gym",
        de: "Schlafhalle",
      };
    case "tent":
      return {
        "en-US": "Tent",
        de: "Zelt",
      };
    case "selfOrganized":
      return {
        "en-US": "Self-organized",
        de: "Woanders",
      };
    default:
      assertNever(accommodation);
  }
}
export const tShirtField = {
  "en-US": "Are you going to buy a T-shirt? (non-binding, costs about 15€)",
  de: "Kannst du dir vorstellen ein T-Shirt zu kaufen? (nicht verbindlich, Kosten etwa 15€)",
};
export const yes = {
  "en-US": "Yes",
  de: "Ja",
};
export const tShirtSizeField = {
  "en-US": "Preferred T-shirt size",
  de: "Bevorzugte T-Shirt-Größe",
};
export const commentField = {
  "en-US": "Anything you want to tell us?",
  de: "Willst du uns noch etwas mitteilen?",
};
export const moreParticipants = {
  "en-US": "Register additional participants",
  de: "Weitere Teilnehmer*innen anmelden",
};
export const sum = {
  "en-US": "Sum",
  de: "Summe",
};
export const registrationTitle = {
  "en-US": "Registration for Freiburg Juggling Convention 2023",
  de: "Anmeldung zur Freiburger Jonglierconvention 2023",
};
export const conventionFull = {
  "en-US": "Unfortunately the convention is already fully booked.",
  de: "Leider sind alle Plätze schon belegt.",
};
export const submitRegister = { "en-US": "Register", de: "Anmelden" };
export const successTitle = {
  "en-US": "Thank you for your registration!",
  de: "Danke für deine Anmeldung!",
};
export const successMessage = {
  "en-US":
    "You should've received an email with your registration details. In case you didn't, please contact us at",
  de: "Du solltest in Kürze eine E-Mail von uns erhalten. Falls nicht, melde dich bitte unter",
};
export const backToOverview = {
  "en-US": "Back to convention page",
  de: "Zur Convention-Seite",
};
export const select = {
  "en-US": "Select",
  de: "Auswählen",
};
export const ticketFeatures = {
  "en-US": ["Accommodation", "Breakfast", "Gala Show & Open Stage"],
  de: ["Übernachtung", "Frühstück", "Gala-Show & Open-Stage"],
};
export const transformToSupportSoli = {
  "en-US": "Make your ticket a supporter or solidarity ticket:",
  de: "Mach dein Ticket zu einem Supporter- oder Soli-Ticket:",
};
export const soliNote = {
  "en-US":
    "Feel free to take the solidarity ticket if you're short on cash right now. We won't ask any questions nor ask for proof.",
  de: "Fühl dich frei das Soli-Ticket in Anspruch zu nehmen, wenn du gerade knapp bei Kasse bist. Wir verlangen beim Soli-Ticket keine Nachweise und stellen auch keine Fragen.",
};
export const soliTicketTitle = {
  "en-US": "Soli",
  de: "Soli",
};
export const regularTicketTitle = {
  "en-US": "Regular",
  de: "Regular",
};
export const supporterTicketTitle = {
  "en-US": "Supporter",
  de: "Supporter",
};
export const someValidationErrors = {
  "en-US": "There are some validation errors, check them out below.",
  de: "Manche Formularfelder sind nicht korrekt ausgefüllt.",
};

export function participantHeader(index: number) {
  return {
    "en-US": `${enUsOrdinal(index)} Participant`,
    de: `${index}. Teilnehmer*in`,
  };
}

function enUsOrdinal(n: number): string {
  const plural = new Intl.PluralRules("en-US", { type: "ordinal" });
  const map = {
    one: "st",
    two: "nd",
    few: "rd",
    many: "th",
    zero: "th",
    other: "th",
  };

  return `${n}${map[plural.select(n)]}`;
}

export function translateAgeCategory(ageCategory: AgeCategory): LocaleMap {
  switch (ageCategory) {
    case "Baby":
      return { de: "0–5 Jahre", "en-US": "0–5 years" };
    case "Child":
      return { de: "6–12 Jahre", "en-US": "6–12 years" };
    case "OlderThan12":
      return { de: "> 12 Jahre", "en-US": "> 12 years" };
    default:
      assertNever(ageCategory);
  }
}

export function translateDurationCategory(duration: Duration): LocaleMap {
  switch (duration) {
    case "Fr-Mo":
      return {
        de: "4 Tage (Freitag – Montag)",
        "en-US": "4 days (Friday to Monday)",
      };
    case "Fr-Su":
      return {
        de: "3 Tage (Freitag – Sonntag)",
        "en-US": "3 days (Friday to Sunday)",
      };
    case "Sa-Mo":
      return {
        de: "3 Tage (Samstag – Montag)",
        "en-US": "3 days (Saturday to Monday)",
      };
    default:
      assertNever(duration);
  }
}

export function translateSupporter(
  supporterCategory: SupporterCategory
): LocaleMap {
  switch (supporterCategory) {
    case "Normal":
      return { de: "", "en-US": "" };
    case "Supporter":
      return { de: "(Supporter)", "en-US": "(Supporter)" };
    case "Cheaper":
      return { de: "(Günstiger)", "en-US": "(Cheaper)" };
    default:
      assertNever(supporterCategory);
  }
}

export function formatCurrency(
  n: Cents,
  currency: string,
  locale: SupportedLocales
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(n / 100);
}

export function sortedCountryList(
  countryCodes: string[],
  locale: SupportedLocales
): { label: string; value: string }[] {
  const countryFormatter = new Intl.DisplayNames(locale, { type: "region" });

  return countryCodes
    .map((code) => ({
      label: countryFormatter.of(code) ?? code,
      value: code,
    }))
    .sort((a, b) => compareStrings(a.label, b.label, locale));
}

export function compareStrings(
  a: string,
  b: string,
  locale: SupportedLocales
): number {
  return new Intl.Collator(locale).compare(a, b);
}
