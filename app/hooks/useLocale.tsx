import React, { useContext } from "react";
import { SupportedLocales } from "~/i18n";

export const LocaleContext = React.createContext<SupportedLocales>("de");

export function useLocale(): {
  locale: SupportedLocales;
  dateTimeFormatter: Intl.DateTimeFormat;
} {
  const locale = useContext(LocaleContext);
  return { locale, dateTimeFormatter: new Intl.DateTimeFormat(locale) };
}
