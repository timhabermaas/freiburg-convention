import { type LocaleMap, SupportedLocales } from "~/i18n";
import { useLocale } from "./useLocale";

function translateF(locale: SupportedLocales): (map: LocaleMap) => string {
  return (map) => {
    return map[locale];
  };
}

export function useTranslation(): (m: LocaleMap) => string {
  const { locale } = useLocale();

  return translateF(locale);
}
