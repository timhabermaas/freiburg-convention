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
  supporterTicket: number | null;
  soliTicket: number | null;
  ticketDescription: LocaleMapT<string[]>;
  tShirt: boolean;
  disclaimer: string;
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
  supporterTicket: 1000,
  soliTicket: -1000,
  ticketDescription: { de: [], "en-US": [] },
  tShirt: true,
  disclaimer: "Some disclaimer",
});

export function useEventConfig(): ClientEventConfig {
  const config = useContext(EventConfigContext);

  return config;
}
