import React, { useContext } from "react";
import { Day } from "~/domain/types";
import { LocaleMap } from "~/i18n";

export interface ClientEventConfig {
  name: LocaleMap;
  start: Day;
  end: Day;
  senderMailAddress: string;
  eventHomepage: string;
}

export const EventConfigContext = React.createContext<ClientEventConfig>({
  name: { de: "Gute Convention", "en-US": "Good Convention" },
  start: new Day(2023, 5, 26),
  end: new Day(2023, 5, 29),
  senderMailAddress: "orga@jonglieren-in-freiburg.de",
  eventHomepage: "https://jonglieren-in-freiburg.de",
});

export function useEventConfig(): ClientEventConfig {
  const config = useContext(EventConfigContext);

  return config;
}
