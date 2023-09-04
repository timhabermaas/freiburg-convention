import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { json, type LoaderFunction, type MetaFunction } from "@remix-run/node";
import { CONFIG } from "./config.server";
import { ClientEventConfig, EventConfigContext } from "./hooks/useEventConfig";
import { Day } from "./domain/types";

export const meta: MetaFunction = ({ data }: { data: ClientEventConfig }) => {
  return { title: data.name.de };
};

export const loader: LoaderFunction = () => {
  const eventConfig: ClientEventConfig = {
    name: CONFIG.event.name,
    start: CONFIG.event.start,
    end: CONFIG.event.end,
    wireTransferDeadline: CONFIG.event.wireTransferDeadline,
    conventionDays: CONFIG.event.conventionDays,
    senderMailAddress: CONFIG.event.senderMail.address,
    eventHomepage: CONFIG.event.eventHomepage,
    tickets: CONFIG.event.tickets,
    supporterTicket: CONFIG.event.supporterTicket,
    soliTicket: CONFIG.event.soliTicket,
  };

  return json(eventConfig);
};

export default function App() {
  const config = useLoaderData<ClientEventConfig>();
  const parsedConfig: ClientEventConfig = {
    ...config,
    start: Day.parse(config.start),
    end: Day.parse(config.end),
    wireTransferDeadline: Day.parse(config.wireTransferDeadline),
    conventionDays: config.conventionDays.map((d) => Day.parse(d)),
    tickets: config.tickets.map((t) => ({
      ...t,
      from: Day.parse(t.from),
      to: Day.parse(t.to),
    })),
  };

  return (
    <EventConfigContext.Provider value={parsedConfig}>
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body>
          <Outlet />
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </body>
      </html>
    </EventConfigContext.Provider>
  );
}
