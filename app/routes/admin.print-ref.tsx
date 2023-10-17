import { LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import * as z from "zod";
import * as i18n from "~/i18n";
import { App } from "~/domain/app.server";
import { formatTicket, ticketPrice, ticketSumForParticipants } from "~/utils";
import { useLocale } from "~/hooks/useLocale";
import styles from "~/styles/print_override.css";
import { useEventConfig } from "~/hooks/useEventConfig";
import { whenAuthorized } from "~/session";

export function links() {
  return [
    {
      rel: "stylesheet",
      type: "text/css",
      href: "https://stackpath.bootstrapcdn.com/bootstrap/4.1.2/css/bootstrap.min.css",
    },
    {
      rel: "stylesheet",
      type: "text/css",
      href: styles,
    },
  ];
}

const LoaderDataSchema = z.object({
  registrations: z.array(
    z.object({
      registrationId: z.string(),
      paymentReason: z.string(),
      tickets: z.array(z.object({ name: z.string(), price: z.number() })),
      priceSum: z.number(),
    })
  ),
});

type LoaderData = z.TypeOf<typeof LoaderDataSchema>;

export const loader: LoaderFunction = async ({ context, request }) => {
  return whenAuthorized<LoaderData>(request, () => {
    const app = context.app as App;

    const registrations = app.getAllActualRegistrations();

    const data: LoaderData = {
      registrations: registrations.map((r) => {
        const participants = app.getParticipantsForRegistration(
          r.registrationId
        );
        return {
          paymentReason: r.paymentReason,
          registrationId: r.registrationId,
          tickets: participants
            .map((r) => r.ticket)
            .map((t) => ({
              name: formatTicket(t, "de"),
              price: ticketPrice(t),
            })),
          priceSum: ticketSumForParticipants(participants),
        };
      }),
    };

    return data;
  });
};

export default function PrintPage() {
  const data = LoaderDataSchema.parse(useLoaderData<unknown>());
  const { dateFormatter, locale } = useLocale();
  const eventConfig = useEventConfig();

  return (
    <div className="container-fluid">
      <div className="mb-3"></div>
      <div className="row">
        <div className="col-md-12">
          <div className="fixed-header">
            <h3 className="text-center">Tickets {eventConfig.name.de}</h3>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-12">
          <table className="table table-bordered table-sm">
            <thead>
              <tr>
                <td>Referenznummer</td>
                <td>Tickets</td>
                <td>Summe</td>
              </tr>
            </thead>
            <tbody>
              {data.registrations.map((r) => (
                <tr key={r.registrationId} style={{ lineHeight: "35px" }}>
                  <td>{r.paymentReason}</td>
                  <td>
                    {r.tickets
                      .map(
                        (t) =>
                          `${t.name}: ${i18n.formatCurrency(
                            t.price,
                            "EUR",
                            "de"
                          )}`
                      )
                      .join("; ")}
                  </td>
                  <td>{i18n.formatCurrency(r.priceSum, "EUR", "de")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
