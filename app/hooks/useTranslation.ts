import { SupportedLocales, useLocale } from "./useLocale";

type LanguageMap = Record<SupportedLocales, string>;

const TRANSLATION: Record<
  string,
  LanguageMap | ((props: Record<string, string>) => LanguageMap)
> = {
  email: { "en-US": "Email", de: "E-Mail" },
  fullNameField: {
    "en-US": "Full Name",
    de: "Name",
  },
  commentField: {
    "en-US": "Anything you want to tell us?",
    de: "Willst du uns noch etwas mitteilen?",
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
    // TODO: Format ordinal for English language correctly.
    return {
      "en-US": `${p.index}. Participant`,
      de: `${p.index}. Teilnehmer*in`,
    };
  },
};

export function useTranslation() {
  const { locale } = useLocale();

  const t = (key: string, props?: Record<string, string>): string => {
    const entry = TRANSLATION[key];
    if (entry && typeof entry === "function") {
      return entry(props ?? {})[locale];
    } else if (entry) {
      return entry[locale];
    } else {
      return key;
    }
  };

  return t;
}
