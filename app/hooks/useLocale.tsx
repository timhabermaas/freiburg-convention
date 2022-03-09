import React, { useContext } from "react";

// See https://en.wikipedia.org/wiki/IETF_language_tag for correct codes.
//export const Languages = { DE: "de", EN_US: "en-US" } as const;

export const Languages = [
  { title: "DE", locale: "de" },
  { title: "EN", locale: "en-US" },
] as const;

export type SupportedLocales = typeof Languages[number]["locale"];

export const LocaleContext = React.createContext<SupportedLocales>("de");

export function useLocale(): {
  locale: SupportedLocales;
  dateTimeFormatter: Intl.DateTimeFormat;
} {
  const locale = useContext(LocaleContext);
  return { locale, dateTimeFormatter: new Intl.DateTimeFormat(locale) };
}
