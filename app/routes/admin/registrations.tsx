import React, { useState } from "react";
import { LoaderFunction, useLoaderData } from "remix";
import { Col } from "~/components/Col";
import { Row } from "~/components/Row";
import { whenAuthorized } from "~/session";
import * as z from "zod";
import * as i18n from "~/i18n";
import { App } from "~/domain/app";
import { isoDateString, PaidStatusSchema } from "~/utils";
import { useLocale } from "~/hooks/useLocale";
import Fuse from "fuse.js";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { faSackDollar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const LoaderDataSchema = z.object({
  registrations: z.array(
    z.object({
      registrationId: z.string(),
      email: z.string(),
      comment: z.string(),
      paymentReason: z.string(),
      registeredAt: isoDateString,
      paidStatus: PaidStatusSchema,
      participantCount: z.number(),
      ticketSum: z.number(),
      participants: z.array(
        z.object({
          fullName: z.string(),
          participantId: z.string(),
        })
      ),
    })
  ),
});

type LoaderData = z.TypeOf<typeof LoaderDataSchema>;

export const loader: LoaderFunction = async ({ request, context }) => {
  return whenAuthorized<LoaderData>(request, () => {
    const app = context.app as App;

    return {
      registrations: app.getAllRegistrations().map((r) => {
        const participants = app.getParticipantsForRegistration(
          r.registrationId
        );
        return {
          ...r,
          paidStatus: app.getPaidStatus(r.registrationId),
          participantCount: participants.length,
          participants: participants,
          ticketSum: participants
            .map((p) => p.ticket.price)
            .reduce((sum, p) => sum + p, 0),
        };
      }),
    };
  });
};

export default function Registrations() {
  // TODO: Use set
  const [openedRows, setOpenedRows] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const data = LoaderDataSchema.parse(useLoaderData<unknown>());
  const { dateTimeFormatter, locale } = useLocale();

  const fuse = new Fuse(data.registrations, {
    includeScore: true,
    useExtendedSearch: true,
    keys: ["paymentReason", "participants.fullName", "email", "comment"],
  });

  const registrations =
    searchText.trim().length > 0
      ? fuse.search(searchText).map((x) => x.item)
      : data.registrations;

  return (
    <>
      <Row>
        <Col cols={12}>
          <h1>Anmeldungen</h1>
        </Col>
      </Row>
      <Row>
        <Col cols={12}>
          <div className="form-group">
            <div className="input-group">
              <div className="input-group-prepend">
                <span className="input-group-text">🔎</span>
              </div>
              <input
                className="form-control"
                onChange={(e) => {
                  setSearchText(e.target.value);
                }}
              />
            </div>
            {searchText.trim().length > 0 && (
              <small className="form-text text-muted">
                {registrations.length} Treffer
              </small>
            )}
          </div>
        </Col>
      </Row>
      <Row>
        <Col cols={12}>
          <table className="table">
            <thead>
              <tr>
                <th>E-Mail</th>
                <th>Anzahl Teilnehmer*innen</th>
                <th>Mitteilung</th>
                <th>Angemeldet am</th>
                <th>Verwendungszweck</th>
                <th>Summe Tickets</th>
                <th>Bezahlt?</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((registration) => (
                <React.Fragment key={registration.registrationId}>
                  <tr
                    onClick={() => {
                      setOpenedRows((rows) => {
                        if (rows.includes(registration.registrationId)) {
                          return rows.filter(
                            (r) => r !== registration.registrationId
                          );
                        } else {
                          return rows.concat([registration.registrationId]);
                        }
                      });
                    }}
                  >
                    <td>{registration.email}</td>
                    <td>{registration.participantCount}</td>
                    <td>{registration.comment}</td>
                    <td>
                      {dateTimeFormatter.format(registration.registeredAt)}
                    </td>
                    <td>{registration.paymentReason}</td>
                    <td>
                      {i18n.formatCurrency(
                        registration.ticketSum,
                        "EUR",
                        locale
                      )}
                    </td>
                    <td>{registration.paidStatus === "paid" ? "✓" : "✘"}</td>
                    <td>
                      <div className="row">
                        <div className="col-md-6">
                          <form
                            action="/registrations/103/delete"
                            method="post"
                          >
                            <button
                              className="btn btn-danger btn-sm"
                              type="submit"
                              name="delete"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </form>
                        </div>
                        <div className="col-md-6">
                          <form action="/registrations/103/pay" method="post">
                            <PayButton />
                          </form>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr
                    className={
                      openedRows.includes(registration.registrationId)
                        ? ""
                        : "d-none"
                    }
                  >
                    <td colSpan={8}>
                      <SubParticipantTable
                        participants={registration.participants}
                      />
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </Col>
      </Row>
    </>
  );
}

interface SubParticipantTableProps {
  participants: { fullName: string; participantId: string }[];
}

function SubParticipantTable(props: SubParticipantTableProps) {
  return (
    <table className="table mb-0">
      <thead>
        <tr>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        {props.participants.map((p) => (
          <tr key={p.participantId}>
            <td>{p.fullName}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PayButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="btn-group">
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <FontAwesomeIcon icon={faSackDollar} />
      </button>
      <button
        type="button"
        className="btn btn-primary btn-sm dropdown-toggle dropdown-toggle-split"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      ></button>
      <div
        className={`dropdown-menu${open ? " show" : ""}`}
        aria-labelledby="dropdownMenuButton"
      >
        <a className="dropdown-item" href="#">
          Teilweise bezahlt
        </a>
      </div>
    </div>
  );
}
