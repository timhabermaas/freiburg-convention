import React from "react";

export type SupportedLanguages = "de" | "en";

export const LocaleContext = React.createContext<SupportedLanguages>("de");
