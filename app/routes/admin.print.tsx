import { LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import * as z from "zod";
import * as i18n from "~/i18n";
import { App } from "~/domain/app.server";
import { AccommodationSchema, DaySchema } from "~/domain/events";
import { formatTicket, lastName, PaidStatusSchema } from "~/utils";
import { useLocale } from "~/hooks/useLocale";
import { CONFIG } from "~/config.server";
import styles from "~/styles/print_override.css";
import { useEventConfig } from "~/hooks/useEventConfig";

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
  participants: z.array(
    z.object({
      fullName: z.string(),
      birthday: DaySchema,
      accommodation: AccommodationSchema,
      paidStatus: PaidStatusSchema,
      participantId: z.string(),
      ticketName: z.string(),
      ticketPriceInCents: z.number(),
    })
  ),
});

type LoaderData = z.TypeOf<typeof LoaderDataSchema>;

export const loader: LoaderFunction = async ({ context, request }) => {
  const url = new URL(request.url);
  if (
    CONFIG.printAccessKey &&
    url.searchParams.get("accessKey") !== CONFIG.printAccessKey
  ) {
    return redirect("/admin");
  }

  const app = context.app as App;

  const participants = app.getAllActualParticipants().map((p) => {
    return {
      participantId: p.participantId,
      fullName: p.fullName,
      accommodation: p.accommodation,
      birthday: p.birthday,
      paidStatus: app.getPaidStatus(p.registrationId),
      ticketName: formatTicket(p.ticket, "de"),
      ticketPriceInCents: p.ticket.price,
    };
  });
  participants.sort((a, b) => {
    const lastNameA = lastName(a.fullName);
    const lastNameB = lastName(b.fullName);
    return lastNameA.localeCompare(lastNameB);
  });

  const data: LoaderData = {
    participants,
  };

  return data;
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
            <h3 className="text-center">
              Anmeldeliste {eventConfig.name.de},{" "}
              {
                // FIXME: requires newer TS version, but that conflicts with the remix version.
                //@ts-ignore
                dateFormatter.formatRange(
                  eventConfig.start.toUtcDate(),
                  eventConfig.end.toUtcDate()
                )
              }
            </h3>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-12">
          <table className="table table-bordered table-sm">
            <thead>
              <tr>
                <td colSpan={10}>
                  <strong>Haftungsausschluss: </strong>Mit meiner Unterschrift
                  bestätige ich, dass mir bekannt ist, dass auf dem
                  Jonglierfestival Freiburg von den OrganisatorInnen keine
                  Haftung für eventuell auftretende Verletzungen, Diebstähle
                  etc. übernommen werden kann. Dies gilt auch für alle
                  Zwischenfälle während der Anfahrt oder Rückreise. Weiterhin
                  bestätige ich, dass ich ausreichend versichert bin (Haft- und
                  Unfallversicherung) und die Hallenordnung anerkenne und den
                  Anweisungen der OrganisatorInnen Folge leiste.
                  <br />
                  <strong>Erklärung zur Bildnutzung: </strong>
                  Mit meiner Unterschrift erkläre ich mich einverstanden, dass
                  Fotos, die während des Festivals von mir gemacht werden, auf
                  der Webseite{" "}
                  <a href="https://www.jonglieren-in-freiburg.de">
                    https://www.jonglieren-in-freiburg.de
                  </a>{" "}
                  veröffentlicht und für Pressezwecke genutzt werden dürfen.
                </td>
              </tr>
              <tr>
                <td></td>
                <td>Name</td>
                <td>Geburtsdatum</td>
                <td>Ticket</td>
                <td>Wo?</td>
                <td>Bezahlt?</td>
                <td>Unterschrift</td>
              </tr>
            </thead>
            <tbody>
              {data.participants.map((p, i) => (
                <tr key={p.participantId} style={{ lineHeight: "35px" }}>
                  <td className="text-right">{i + 1}</td>
                  <td>{p.fullName}</td>
                  <td>{dateFormatter.format(p.birthday.toUtcDate())}</td>
                  <td style={{ minWidth: "160px" }}>{p.ticketName}</td>
                  <td>
                    {i18n.accommodationFieldShort(p.accommodation)[locale]}
                  </td>
                  <td>{p.paidStatus.type === "notPaid" ? "✘" : "✔"}</td>
                  <td style={{ minWidth: "200px" }}></td>
                </tr>
              ))}
              {Array(250)
                .fill(0)
                .map((_x, i) => data.participants.length + i)
                .map((i) => (
                  <tr key={i} style={{ lineHeight: "60px" }}>
                    <td className="text-right">{i + 1}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
