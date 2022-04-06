import { TicketCard } from "./TicketCard";
import * as i18n from "~/i18n";
import { Ticket } from "~/domain/types";
import { ValidateErrorMessage } from "./ValidateErrorMessage";
import { RadioButtonGroup } from "./RadioButtonGroup";
import { formatTimeSpan } from "~/utils";
import { useEffect, useState } from "react";

interface TicketCardGroupProps {
  tickets: Ticket[];
  ticketName: string;
  priceModifierName: string;
  locale: i18n.SupportedLocales;
  defaultTicketId?: string;
  defaultPriceModifier?: string;
  errorMessages?: string[];
  onClickTicket: (ticketId: string) => void;
}

export function TicketCardGroup(props: TicketCardGroupProps) {
  const [priceModifier, setPriceModifier] = useState<string | undefined>(
    props.defaultPriceModifier
  );

  let priceModifierCents: number;

  if (priceModifier === "Supporter") {
    priceModifierCents = 1000;
  } else if (priceModifier === "Cheaper") {
    priceModifierCents = -1000;
  } else {
    priceModifierCents = 0;
  }

  useEffect(() => {
    setPriceModifier(props.defaultPriceModifier);
  }, [props.defaultPriceModifier]);

  const errorMessages = props.errorMessages ?? [];
  const selectedTicket = props.tickets.find(
    (t) => t.ticketId === props.defaultTicketId
  );

  return (
    <>
      <div className="form-group">
        <div className={errorMessages.length > 0 ? "is-invalid" : ""}>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3">
            {props.tickets.map((t) => (
              <div key={t.ticketId} className="col mb-3">
                <TicketCard
                  ticket={t}
                  name={props.ticketName}
                  locale={props.locale}
                  selected={props.defaultTicketId === t.ticketId}
                  onClick={() => {
                    props.onClickTicket(t.ticketId);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        {errorMessages.length > 0 ? (
          <ValidateErrorMessage text={errorMessages[0]} />
        ) : null}
      </div>
      {selectedTicket !== undefined && selectedTicket.ageCategory !== "Baby" && (
        <RadioButtonGroup
          label=""
          options={[
            { label: "Supporter (+10€)", value: "Supporter" },
            { label: "Cheaper (-10€)", value: "Cheaper" },
          ]}
          name={props.priceModifierName}
          onClick={(selected) => {
            setPriceModifier(selected);
          }}
          defaultValue={priceModifier}
        />
      )}
      {selectedTicket && (
        <table className="table table-borderless">
          <tbody>
            <tr>
              <td>
                {formatTimeSpan(selectedTicket, props.locale)},{" "}
                {
                  i18n.translateCategory(selectedTicket.ageCategory)[
                    props.locale
                  ]
                }
              </td>
              <td className="text-right">
                {i18n.formatCurrency(selectedTicket.price, "EUR", props.locale)}
              </td>
            </tr>
            {priceModifierCents !== 0 && (
              <tr>
                <td></td>
                <td className="text-right">
                  {i18n.formatCurrency(priceModifierCents, "EUR", props.locale)}
                </td>
              </tr>
            )}
            <tr>
              <th scope="row">Summe</th>
              <th className="text-right">
                {i18n.formatCurrency(
                  selectedTicket.price + priceModifierCents,
                  "EUR",
                  props.locale
                )}
              </th>
            </tr>
          </tbody>
        </table>
      )}
    </>
  );
}
