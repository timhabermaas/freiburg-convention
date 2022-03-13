import { TRANSLATION } from "~/i18n";
import { useLocale } from "./useLocale";

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
