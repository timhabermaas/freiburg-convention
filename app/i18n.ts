import { Category, Cents } from "./domain/types";

// See https://en.wikipedia.org/wiki/IETF_language_tag for correct codes.
export const Languages = [
  { title: "DE", locale: "de" },
  { title: "EN", locale: "en-US" },
] as const;

export type SupportedLocales = typeof Languages[number]["locale"];

export type LanguageMap = Record<SupportedLocales, string>;

export const TRANSLATION: Record<
  string,
  LanguageMap | ((props: Record<string, string>) => LanguageMap)
> = {
  email: { "en-US": "Email", de: "E-Mail" },
  fullNameField: {
    "en-US": "Full Name",
    de: "Name",
  },
  birthdayField: {
    "en-US": "Birthday",
    de: "Geburtstag",
  },
  streetField: {
    "en-US": "Street",
    de: "Straße",
  },
  postalCodeField: {
    "en-US": "Postal Code",
    de: "PLZ",
  },
  cityField: {
    "en-US": "City",
    de: "Stadt",
  },
  countryField: {
    "en-US": "Country",
    de: "Land",
  },
  ticketField: {
    "en-US": "Ticket",
    de: "Festivalticket",
  },
  accommodationField: {
    "en-US": "Accommodation",
    de: "Unterkunft",
  },
  accommodationFieldgym: {
    "en-US": "Gym",
    de: "Schlafhalle",
  },
  accommodationFieldtent: {
    "en-US": "Tent",
    de: "Zelt neben der Halle",
  },
  accommodationFieldselfOrganized: {
    "en-US": "Self-organized",
    de: "Ich sorge für meine eigene Übernachtung",
  },
  commentField: {
    "en-US": "Anything you want to tell us?",
    de: "Willst du uns noch etwas mitteilen?",
  },
  moreParticipants: {
    "en-US": "Register additional participants",
    de: "Weitere Teilnehmer*innen anmelden",
  },
  registrationTitle: {
    "en-US": "Registration for Freiburg Juggling Convention 2022",
    de: "Anmeldung zur Freiburger Jonglierconvention 2022",
  },
  submitRegister: { "en-US": "Register", de: "Anmelden" },
  successTitle: {
    "en-US": "Thank you for your registration!",
    de: "Danke für deine Anmeldung!",
  },
  successMessage: {
    "en-US":
      "You should've received an email with your registration details. In case you didn't please contact us at",
    de: "Du solltest in Kürze eine E-Mail von uns erhalten. Falls nicht, melde dich bitte unter",
  },
  participantHeader: (p) => {
    return {
      "en-US": `${enUsOrdinal(parseInt(p.index, 10))} Participant`,
      de: `${p.index}. Teilnehmer*in`,
    };
  },
};

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

export function translateCategory(
  category: Category,
  locale: SupportedLocales
): string {
  const de: Record<Category, string> = {
    Baby: "0–3 Jahre",
    Child: "4–12 Jahre",
    OlderThan12: ">12 Jahre",
    Supporter: ">12 Jahre (Supporter)",
  };
  const en: Record<Category, string> = {
    Baby: "0–3 years",
    Child: "4–12 years",
    OlderThan12: ">12 years",
    Supporter: ">12 years (supporter)",
  };

  switch (locale) {
    case "de":
      return de[category];
    case "en-US":
      return en[category];
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
