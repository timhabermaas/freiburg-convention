import { addEvent } from "./state";
import { EventStore } from "../services/stores/interface";
import { Event, EventEnvelope } from "~/domain/events";
import { v4 as uuid } from "uuid";
import {
  Accommodation,
  Address,
  Cents,
  Day,
  Mail,
  Ticket,
} from "~/domain/types";
import { TICKETS } from "./tickets";
import { MailSender } from "~/services/email/interface";
import { formatCurrency } from "~/i18n";
import { formatTicket } from "~/utils";

interface State {
  personIds: Set<string>;
  latestVersion: number;
}

export class App {
  private eventStore: EventStore;
  private mailSender: MailSender;
  private state: State = { personIds: new Set(), latestVersion: 0 };

  constructor(eventStore: EventStore, mailSender: MailSender) {
    this.eventStore = eventStore;
    this.mailSender = mailSender;
  }

  public async replay(): Promise<void> {
    for (const event of await this.eventStore.readAll()) {
      this.apply(event);
    }
  }

  // TODO: Make sure the mutating functions are pushed to queue (`fastq`) and handled serialized.
  public async registerPerson(
    email: string,
    participants: {
      fullName: string;
      address: Address;
      ticketId: string;
      birthday: Day;
      accommodation: Accommodation;
    }[],
    comment: string
  ) {
    const persistedParticipants = participants.map((p) => {
      const ticket = this.findTicketOrThrow(p.ticketId);

      return {
        participantId: uuid(),
        fullName: p.fullName,
        address: p.address,
        ticket: ticket,
        birthday: p.birthday,
        accommodation: p.accommodation,
      };
    });

    if (this.state.personIds.size < 100) {
      await this.saveEvent({
        type: "RegisterEvent",
        registrationId: uuid(),
        participants: persistedParticipants,
        email,
        comment,
      });

      this.mailSender.send(
        composeMail(
          email,
          persistedParticipants[0].fullName,
          persistedParticipants.map((p) => ({
            name: formatTicket(this.findTicketOrThrow(p.ticket.ticketId), "de"),
            price: p.ticket.price,
          })),
          comment
        )
      );
    }
  }

  public async deleteRegistration(personId: string) {
    await this.saveEvent({
      type: "DeletePersonEvent",
      personId,
    });
  }

  private apply(event: EventEnvelope<Event>): void {
    switch (event.payload.type) {
      case "AddPersonEvent": {
        this.state.personIds.add(event.payload.personId);
        break;
      }
      case "DeletePersonEvent": {
        this.state.personIds.delete(event.payload.personId);
        break;
      }
    }

    this.state.latestVersion = event.version;
  }

  private async saveEvent(event: Event): Promise<void> {
    const eventEnvelope = await addEvent(
      this.eventStore,
      event,
      this.state.latestVersion + 1
    );

    this.apply(eventEnvelope);
  }

  private findTicketOrThrow(ticketId: string): Ticket {
    const ticket = TICKETS.find((t) => t.ticketId === ticketId);

    if (!ticket) {
      throw new Error(`couldn't find ticket ${ticketId}`);
    }

    return ticket;
  }
}

function composeMail(
  toMailAddress: string,
  fullName: string,
  tickets: { name: string; price: Cents }[],
  comment: string
): Mail {
  const totalPrice = formatCurrency(
    tickets.map((t) => t.price).reduce((a, b) => a + b, 0),
    "EUR",
    "de"
  );
  const paymentReason = "TODO";
  const subject = "Bestellbestätigung Freiburger Jonglierfestival";
  const ticketLines = tickets
    .map((t) => `* ${t.name}: ${formatCurrency(t.price, "EUR", "de")}`)
    .join("\n");

  const body = `(English version below)

Liebe/r ${fullName},

du hast für das 23. Freiburger Jonglierfestival folgende Tickets bestellt:

${ticketLines}

Außerdem hast du uns folgenden Kommentar hinterlassen: ${comment}

Bitte überweise das Geld dafür bis zum 12.05.2022 auf unser Konto:

Empfänger: Jonglieren in Freiburg e.V.
Bank: Sparkasse Freiburg Nördlicher Breisgau
IBAN: DE26 6805 0101 0012 0917 91
BIC: FRSPDE66XXX
Betrag: ${totalPrice}
Verwendungszweck: ${paymentReason}

Wir freuen uns Dich auf dem Festival zu sehen.
Viele Grüße Dein
Orgateam


-------English-------


Dear ${fullName},

you ordered the following tickets for the Freiburg Juggling Convention:

${ticketLines}

You sent us the following comment: ${comment}

Please transfer the money to our account until the 12th of May of 2022:

Recipient: Jonglieren in Freiburg e.V.
Bank: Sparkasse Freiburg Nördlicher Breisgau
IBAN: DE26 6805 0101 0012 0917 91
BIC: FRSPDE66XXX
Amount: ${totalPrice}
Reference: ${paymentReason}

We're looking forward to meeting you at the festival!
Cheers!
Your orga team
`;

  return {
    subject,
    body,
    from: "Jonglieren in Freiburg e.V. <orga@jonglieren-in-freiburg.de>",
    to: [toMailAddress],
    cc: [],
  };
}
