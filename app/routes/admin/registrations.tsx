import { LoaderFunction } from "remix";
import { Col } from "~/components/Col";
import { Row } from "~/components/Row";
import { whenAuthorized } from "~/session";

export const loader: LoaderFunction = async ({ request }) => {
  return whenAuthorized<{}>(request, () => {
    return {};
  });
};

export default function Registrations() {
  return (
    <>
      <Row>
        <Col cols={12}>
          <h1>Anmeldungen</h1>
        </Col>
      </Row>
    </>
  );
}
