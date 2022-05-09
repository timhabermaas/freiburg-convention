import { LoaderFunction, useLoaderData } from "remix";
import * as z from "zod";
import * as i18n from "~/i18n";
import { App } from "~/domain/app";
import { AccommodationSchema, DaySchema } from "~/domain/events";
import { formatTicket, PaidStatusSchema } from "~/utils";
import { useLocale } from "~/hooks/useLocale";

export function links() {
  return [
    {
      rel: "stylesheet",
      type: "text/css",
      href: "https://stackpath.bootstrapcdn.com/bootstrap/4.1.2/css/bootstrap.min.css",
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

export const loader: LoaderFunction = async ({ context }) => {
  const app = context.app as App;
  const data: LoaderData = {
    participants: app.getAllParticipants().map((p) => {
      const ticket = app.findTicketOrThrow(p.ticket.ticketId);

      return {
        participantId: p.participantId,
        fullName: p.fullName,
        accommodation: p.accommodation,
        birthday: p.birthday,
        paidStatus: app.getPaidStatus(p.registrationId),
        ticketName: formatTicket(ticket, "de"),
        ticketPriceInCents: ticket.price,
      };
    }),
  };

  return data;
};

export default function PrintPage() {
  const data = LoaderDataSchema.parse(useLoaderData<unknown>());
  const { dateFormatter, locale } = useLocale();

  return (
    <div className="container">
      <div className="mb-3"></div>
      <div className="row">
        <div className="col-md-12">
          <div className="fixed-header">
            <h3 className="text-center">
              Anmeldeliste 22. Freiburger Jonglierfestival – 26. Mai bis 29. Mai
              2022
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
                  Unfallversicherung), die Hallenordnung und das Hygienekonzept
                  anerkenne und den Anweisungen der OrganisatorInnen Folge
                  leiste.
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
                <td>Geburtstag</td>
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
                  <td style={{ minWidth: "100px" }}>
                    {p.paidStatus.type === "notPaid"
                      ? `✘ (${i18n.formatCurrency(
                          p.ticketPriceInCents,
                          "EUR",
                          locale
                        )})`
                      : "✔"}
                  </td>
                  <td></td>
                </tr>
              ))}
              {Array(150)
                .fill(0)
                .map((_x, i) => data.participants.length + i)
                .map((i) => (
                  <tr key={i} style={{ lineHeight: "35px" }}>
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
