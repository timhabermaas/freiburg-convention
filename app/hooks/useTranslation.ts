import { useContext } from "react";
import { LocaleContext } from "~/contexts/LocaleContext";

const TRANSLATION: Record<string, { en: string; de: string }> = {
  email: { en: "Email", de: "E-Mail" },
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
};

export function useTranslation() {
  const locale = useContext(LocaleContext);

  const t = (key: string): string => {
    if (TRANSLATION[key]) {
      return TRANSLATION[key][locale];
    } else {
      return key;
    }
  };

  return t;
}
