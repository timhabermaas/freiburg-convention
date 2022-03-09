import { useContext } from "react";
import { LocaleContext } from "~/contexts/LocaleContext";

const TRANSLATION: Record<
  string,
  | { en: string; de: string }
  | ((props: Record<string, string>) => { en: string; de: string })
> = {
  email: { en: "Email", de: "E-Mail" },
  fullNameField: {
    en: "Full Name",
    de: "Name",
  },
  commentField: {
    en: "Anything you want to tell us?",
    de: "Willst du uns noch etwas mitteilen?",
  },
  registrationTitle: {
    en: "Registration for Freiburg Juggling Convention 2022",
    de: "Anmeldung zur Freiburger Jonglierconvention 2022",
  },
  submitRegister: { en: "Register", de: "Anmelden" },
  successTitle: {
    en: "Thank you for your registration!",
    de: "Danke für deine Anmeldung!",
  },
  successMessage: {
    en: "You should've received an email with your registration details. In case you didn't please contact us at",
    de: "Du solltest in Kürze eine E-Mail von uns erhalten. Falls nicht, melde dich bitte unter",
  },
  participantHeader: (p) => {
    // TODO: Format ordinal for English language correctly.
    return { en: `${p.index}. Participant`, de: `${p.index}. Teilnehmer*in` };
  },
};

export function useTranslation() {
  const locale = useContext(LocaleContext);

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
