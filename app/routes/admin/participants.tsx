import { LoaderFunction, useLoaderData } from "remix";
import { Col } from "~/components/Col";
import { Row } from "~/components/Row";
import { ACCOMMODATIONS } from "~/domain/accommodation";
import { App } from "~/domain/app";
import { useLocale } from "~/hooks/useLocale";
import * as i18n from "~/i18n";
import { whenAuthorized } from "~/session";
import * as z from "zod";
import { AccommodationSchema, NestedParticipantSchema } from "~/domain/events";
import {
  formatAddress,
  formatTicket,
  PaidStatusSchema,
  ticketPrice,
} from "~/utils";
import { Accommodation, Limits } from "~/domain/types";

function getLimitFor(
  accommodation: Accommodation,
  limits: Limits
): number | undefined {
  switch (accommodation) {
    case "gym":
      return limits.gym;
    case "tent":
      return limits.tent;
    default:
      return undefined;
  }
}

const LoaderDataSchema = z.object({
  accommodationTable: z.array(
    z.tuple([AccommodationSchema, z.number(), z.number(), z.number()])
  ),
  participants: z.array(
    z.tuple([NestedParticipantSchema, PaidStatusSchema, z.string()])
  ),
  limits: z.object({
    total: z.optional(z.number()),
    tent: z.optional(z.number()),
    gym: z.optional(z.number()),
  }),
});

type LoaderData = z.TypeOf<typeof LoaderDataSchema>;

export const loader: LoaderFunction = async ({ context, request }) => {
  return whenAuthorized<LoaderData>(request, () => {
    const app = context.app as App;

    const data: LoaderData = {
      accommodationTable: ACCOMMODATIONS.map((a) => [
        a,
        app.getParticipantCountForAccommodation(a, true, false),
        app.getParticipantCountForAccommodation(a, false, true),
        app.getParticipantCountForAccommodation(a, true, true),
      ]),
      participants: app
        .getAllActualParticipants()
        .map((p) => [
          p,
          app.getPaidStatus(p.registrationId),
          app.getComment(p.registrationId),
        ]),
      limits: app.getLimits(),
    };

    return data;
  });
};

export default function Participants() {
  const data = LoaderDataSchema.parse(useLoaderData<unknown>());
  const { dateFormatter } = useLocale();

  return (
    <>
      <Row>
        <Col cols={12}>
          <h1>Teilnehmer*innen</h1>
        </Col>
      </Row>
      <div className="mb-4"></div>
      <Row>
        <Col cols={12}>
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th className="text-right">Do–So</th>
                <th className="text-right">Fr–So</th>
                <th className="text-right">Summe</th>
              </tr>
            </thead>
            <tbody>
              {data.accommodationTable.map(
                ([accommodation, thuSun, friSun, total]) => (
                  <tr key={accommodation}>
                    <th>{i18n.accommodationFieldType(accommodation).de}</th>
                    <td className="text-right">{thuSun}</td>
                    <td className="text-right">{friSun}</td>
                    <td className="text-right">
                      <strong>{total}</strong>
                      <small>
                        {" "}
                        (max {getLimitFor(accommodation, data.limits) ?? "∞"})
                      </small>
                    </td>
                  </tr>
                )
              )}
              <tr>
                <td></td>
                <td></td>
                <td></td>
                <td className="text-right">
                  <strong>
                    {data.accommodationTable
                      .map((row) => row[3])
                      .reduce((sum, x) => sum + x, 0)}
                  </strong>
                  <small> (max {data.limits.total})</small>
                </td>
              </tr>
            </tbody>
          </table>
        </Col>
      </Row>
      <div className="row mb-2"></div>
      <Row>
        <Col cols={12}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Geburtsdatum</th>
                <th>Postadresse</th>
                <th>Ticket</th>
                <th>Schlafgelegenheit</th>
                <th>Bezahlt?</th>
                <th>Mitteilung</th>
              </tr>
            </thead>
            <tbody>
              {data.participants.map(([participant, paidStatus, comment]) => (
                <tr key={participant.participantId}>
                  <td>{participant.fullName}</td>
                  <td>
                    {dateFormatter.format(participant.birthday.toUtcDate())}
                  </td>
                  <td>{formatAddress(participant.address, "de")}</td>
                  <td>{formatTicket(participant.ticket, "de")}</td>
                  <td>
                    {
                      i18n.accommodationFieldTypeShort(
                        participant.accommodation
                      )["de"]
                    }
                  </td>
                  <td>
                    {paidStatus.type === "paid"
                      ? "Bezahlt"
                      : `Nicht bezahlt: ${i18n.formatCurrency(
                          ticketPrice(participant.ticket),
                          "EUR",
                          "de"
                        )}`}
                  </td>
                  <td>{comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Col>
      </Row>
    </>
  );
}
