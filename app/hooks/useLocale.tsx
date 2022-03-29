import React, { useContext } from "react";
import { SupportedLocales } from "~/i18n";

export const LocaleContext = React.createContext<SupportedLocales>("de");

export function useLocale(): {
  locale: SupportedLocales;
  dateTimeFormatter: Intl.DateTimeFormat;
  dateFormatter: Intl.DateTimeFormat;
  countryFormatter: Intl.DisplayNames;
} {
  const locale = useContext(LocaleContext);
  return {
    locale,
    dateTimeFormatter: new Intl.DateTimeFormat(locale),
    dateFormatter: new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }),
    countryFormatter: new Intl.DisplayNames(locale, { type: "region" }),
  };
}
