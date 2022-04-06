import { Ticket } from "~/domain/types";
import * as i18n from "~/i18n";
import { formatDuration, formatTimeSpan } from "~/utils";

interface TicketCardProps {
  ticket: Ticket;
  locale: i18n.SupportedLocales;
  selected?: boolean;
  onClick?: () => void;
  name: string;
}

export function TicketCard(props: TicketCardProps) {
  const textPrimary = props.selected ? "text-primary" : "";

  return (
    <div className={`card${props.selected ? " border-primary" : ""}`}>
      <div className={`card-header ${textPrimary}`}>
        <h5>
          {formatDuration(props.ticket, props.locale)},{" "}
          {formatTimeSpan(props.ticket, props.locale)}
        </h5>
      </div>
      <div className="card-body">
        <h5 className="card-title">
          {i18n.translateCategory(props.ticket.ageCategory)[props.locale]}
        </h5>
        <ul style={{ paddingLeft: "20px" }}>
          {i18n.ticketFeatures[props.locale].map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <p className={`card-text text-right ${textPrimary}`}>
          {i18n.formatCurrency(props.ticket.price, "EUR", props.locale)}
        </p>
        <a
          href="#"
          onClick={(event) => {
            event.preventDefault();
            props.onClick && props.onClick();
          }}
          className={`btn ${
            props.selected ? "btn-primary" : "btn-outline-primary"
          }`}
        >
          {i18n.select[props.locale]}
        </a>

        <div className="d-none">
          <input
            type="radio"
            name={props.name}
            value={props.ticket.ticketId}
            checked={props.selected}
            readOnly
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
