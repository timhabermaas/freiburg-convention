import { useContext } from "react";
import { LocaleContext } from "~/contexts/LocaleContext";

const TRANSLATION: Record<string, { en: string; de: string }> = {
  email: { en: "Email", de: "E-Mail" },
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
