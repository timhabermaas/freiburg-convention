import { LanguageMap, SupportedLocales } from "~/i18n";
import { useLocale } from "./useLocale";

function translateF(locale: SupportedLocales): (map: LanguageMap) => string {
  return (map) => {
    return map[locale];
  };
}

export function useTranslation(): (m: LanguageMap) => string {
  const { locale } = useLocale();

  return translateF(locale);
}
