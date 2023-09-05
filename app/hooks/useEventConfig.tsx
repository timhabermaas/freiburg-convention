import React, { useContext } from "react";
import { Day } from "~/domain/types";
import { LocaleMap, LocaleMapT } from "~/i18n";

export interface ClientEventConfig {
  name: LocaleMap;
  start: Day;
  end: Day;
  wireTransferDeadline: Day;
  conventionDays: Day[];
  senderMailAddress: string;
  eventHomepage: string;
  tickets: { id: string; from: Day; to: Day; price: number }[];
  supporterTicket: boolean;
  soliTicket: boolean;
  ticketDescription: LocaleMapT<string[]>;
  tShirt: boolean;
}

export const EventConfigContext = React.createContext<ClientEventConfig>({
  name: { de: "Gute Convention", "en-US": "Good Convention" },
  start: new Day(2023, 5, 26),
  end: new Day(2023, 5, 29),
  wireTransferDeadline: new Day(2023, 5, 22),
  conventionDays: [
    new Day(2023, 5, 26),
    new Day(2023, 5, 27),
    new Day(2023, 5, 28),
    new Day(2023, 5, 29),
  ],
  senderMailAddress: "orga@jonglieren-in-freiburg.de",
  eventHomepage: "https://jonglieren-in-freiburg.de",
  tickets: [],
  supporterTicket: true,
  soliTicket: true,
  ticketDescription: { de: [], "en-US": [] },
  tShirt: true,
});

export function useEventConfig(): ClientEventConfig {
  const config = useContext(EventConfigContext);

  return config;
}
