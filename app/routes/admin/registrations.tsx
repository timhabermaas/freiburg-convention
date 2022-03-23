import { Col } from "~/components/Col";
import { Navigation } from "~/components/Navigation";
import { Row } from "~/components/Row";

export default function Registrations() {
  return (
    <>
      <Row>
        <Col cols={12}>
          <h1>Anmeldungen</h1>
        </Col>
      </Row>
      <Row>
        <Col cols={12}>
          <Navigation
            items={[
              {
                title: "Anmeldungen",
                href: "/admin/registrations",
                active: true,
              },
              {
                title: "Teilnehmer*innen",
                href: "/admin/participants",
                active: false,
              },
            ]}
          />
        </Col>
      </Row>
    </>
  );
}
