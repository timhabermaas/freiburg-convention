import { LoaderFunction, useLoaderData } from "remix";
import { Col } from "~/components/Col";
import { Navigation } from "~/components/Navigation";
import { Row } from "~/components/Row";
import { ACCOMMODATIONS } from "~/domain/accommodation";
import { App } from "~/domain/app";
import { Accommodation, Participant } from "~/domain/types";
import * as i18n from "~/i18n";

interface LoaderData {
  accommodationTable: [Accommodation, number, number, number][];
  participants: Participant[];
}

export const loader: LoaderFunction = async ({ context }) => {
  const app = context.app as App;

  const data: LoaderData = {
    accommodationTable: ACCOMMODATIONS.map((a) => [
      a,
      app.getParticipantsFor(a, true, false),
      app.getParticipantsFor(a, false, true),
      app.getParticipantsFor(a, true, true),
    ]),
    participants: app.getAllParticipants(),
  };

  return data;
};

export default function Participants() {
  const data = useLoaderData<LoaderData>();

  return (
    <>
      <Row>
        <Col cols={12}>
          <h1>Teilnehmer*innen</h1>
        </Col>
      </Row>
      <Row>
        <Col cols={12}>
          <Navigation
            items={[
              {
                title: "Anmeldungen",
                href: "/admin/registrations",
                active: false,
              },
              {
                title: "Teilnehmer*innen",
                href: "/admin/participants",
                active: true,
              },
            ]}
          />
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
                  <tr>
                    <th>{i18n.accommodationFieldType(accommodation).de}</th>
                    <td className="text-right">{thuSun}</td>
                    <td className="text-right">{friSun}</td>
                    <td className="text-right">
                      <strong>{total}</strong>
                      <small> (max 65)</small>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </Col>
      </Row>
      <Row>
        <Col cols={12}>
          <pre>{data.participants.length}</pre>
          <pre>{JSON.stringify(data.participants, null, 2)}</pre>
        </Col>
      </Row>
    </>
  );
}
