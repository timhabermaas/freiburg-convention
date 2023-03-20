import { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Col } from "~/components/Col";
import { Row } from "~/components/Row";
import { ACCOMMODATIONS } from "~/domain/accommodation";
import { App, CONVENTION_DAYS } from "~/domain/app";
import { useLocale } from "~/hooks/useLocale";
import * as i18n from "~/i18n";
import { whenAuthorized } from "~/session";
import * as z from "zod";
import { NestedParticipantSchema } from "~/domain/events";
import {
  formatAddress,
  formatTicket,
  formatWeekday,
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
  accommodationDayCount: z.record(z.number()),
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
      accommodationDayCount: app.getAccommodationDayMap(),
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
                {CONVENTION_DAYS.map((day) => (
                  <th className="text-right">{formatWeekday(day, "de")}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ACCOMMODATIONS.map((accommodation) => (
                <tr key={accommodation}>
                  <th>{i18n.accommodationFieldType(accommodation).de}</th>
                  {CONVENTION_DAYS.map((day) => (
                    <td className="text-right">
                      {data.accommodationDayCount[
                        accommodation + "-" + day.toJSON()
                      ] ?? 0}
                    </td>
                  ))}
                  <td className="text-right">
                    <strong>{data.accommodationDayCount[accommodation]}</strong>
                    <small>
                      /{getLimitFor(accommodation, data.limits) ?? "∞"}
                    </small>
                  </td>
                </tr>
              ))}
              <tr>
                <td></td>
                {CONVENTION_DAYS.map((day) => (
                  <td></td>
                ))}
                <td className="text-right">
                  <strong>{data.participants.length}</strong>
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
                      i18n.accommodationFieldShort(participant.accommodation)[
                        "de"
                      ]
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
