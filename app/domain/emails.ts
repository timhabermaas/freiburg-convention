import { formatCurrency } from "~/i18n";
import { Cents, Mail } from "./types";

const MAIL_FROM =
  "Jonglieren in Freiburg e.V. <orga@jonglieren-in-freiburg.de>";
const MAIL_CC = MAIL_FROM;

export function buildMail(
  toMailAddress: string,
  subject: string,
  body: string
): Mail {
  return { to: [toMailAddress], from: MAIL_FROM, cc: [MAIL_CC], subject, body };
}

export function composeRegistrationMail(
  toMailAddress: string,
  fullName: string,
  paymentReason: string,
  tickets: { name: string; fullPrice: Cents }[],
  comment: string
): Mail {
  const totalPrice = formatCurrency(
    tickets.map((t) => t.fullPrice).reduce((a, b) => a + b, 0),
    "EUR",
    "de"
  );
  const subject = "Bestellbestätigung Freiburger Jonglierfestival";
  const ticketLines = tickets
    .map((t) => `* ${t.name}: ${formatCurrency(t.fullPrice, "EUR", "de")}`)
    .join("\n");

  const body = `(English version below)

Liebe/r ${fullName},

du hast für das 24. Freiburger Jonglierfestival folgende Tickets bestellt:

${ticketLines}

Außerdem hast du uns folgenden Kommentar hinterlassen: ${comment}

Bitte überweise das Geld dafür bis zum 22.05.2023 auf unser Konto:

Empfänger: Jonglieren in Freiburg e.V.
Bank: Sparkasse Freiburg Nördlicher Breisgau
IBAN: DE26 6805 0101 0012 0917 91
BIC: FRSPDE66XXX
Betrag: ${totalPrice}
Verwendungszweck: ${paymentReason}

Wir freuen uns Dich auf dem Festival zu sehen.
Viele Grüße,
Dein Orgateam


-------English-------


Dear ${fullName},

you ordered the following tickets for the Freiburg Juggling Convention:

${ticketLines}

You sent us the following comment: ${comment}

Please transfer the money to our account until May 22nd, 2023:

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
    from: MAIL_FROM,
    to: [toMailAddress],
    cc: [MAIL_CC],
  };
}

export function composePaymentReceivedMail(
  toMailAddress: string,
  fullName: string,
  amount: number
): Mail {
  const receivedAmount = formatCurrency(amount, "EUR", "de");
  const subject = "Freiburger Jonglierfestival: Bezahlung erhalten";

  const body = `(English version below)

Liebe/r ${fullName},

wir haben deine Zahlung über ${receivedAmount} erhalten. Vielen Dank!

Wir freuen uns Dich auf dem Festival zu sehen.
Viele Grüße,
Dein Orgateam


-------English-------


Dear ${fullName},

we've received your payment of ${receivedAmount}.

We're looking forward to meeting you at the festival!
Cheers!
Your orga team
`;

  return {
    subject,
    body,
    from: MAIL_FROM,
    to: [toMailAddress],
    cc: [MAIL_CC],
  };
}

export function composePaymentReminderMail(
  toMailAddress: string,
  fullName: string,
  paymentReason: string,
  tickets: { name: string; fullPrice: Cents }[]
): Mail {
  const totalPrice = formatCurrency(
    tickets.map((t) => t.fullPrice).reduce((a, b) => a + b, 0),
    "EUR",
    "de"
  );
  const subject = "Zahlungserinnerung Freiburger Jonglierfestival";
  const ticketLines = tickets
    .map((t) => `* ${t.name}: ${formatCurrency(t.fullPrice, "EUR", "de")}`)
    .join("\n");

  const body = `(English version below)

Liebe/r ${fullName},

das 24. Freiburger Jonglierfestival steht vor der Tür, bitte denk daran uns noch den Teilnahmebeitrag zu überweisen.
Falls du doch nicht kommen kannst oder eigentlich schon überwiesen hast, gib uns bitte Bescheid.

Zur Erinnerung, du hattest folgende Tickets bestellt:

${ticketLines}

Bitte überweise das Geld dafür bis zum 23.05.2023 auf unser Konto.

Empfänger: Jonglieren in Freiburg e.V.
Bank: Sparkasse Freiburg Nördlicher Breisgau
IBAN: DE26 6805 0101 0012 0917 91
BIC: FRSPDE66XXX
Betrag: ${totalPrice}
Verwendungszweck: ${paymentReason}

Wir freuen uns Dich auf dem Festival zu sehen!
Viele Grüße,
Dein Orgateam


-------English-------


Dear ${fullName},

the Freiburg Juggling Convention is right around the corner. Please remember to pay your tickets.
If you can't make it to the convention or if you have already paid, please drop us a line.

You ordered the following tickets for the Freiburg Juggling Convention:

${ticketLines}

Please transfer the money to our account by May 23rd, 2023.

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
    from: MAIL_FROM,
    to: [toMailAddress],
    cc: [MAIL_CC],
  };
}
