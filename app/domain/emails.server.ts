import { formatCurrency, formatLongDate } from "~/i18n";
import { Cents, Mail } from "./types";
import { Day } from "./types";
import { assertNever } from "~/utils";
import { SupportedLocales } from "~/i18n";
import { CONFIG } from "~/config.server";

const MAIL_FROM = `${CONFIG.event.senderMail.displayName} <${CONFIG.event.senderMail.address}>`;
const MAIL_CC = MAIL_FROM;
const BANK_TRANSFER_DEADLINE = CONFIG.event.wireTransferDeadline;

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
  const subject = `Bestellbestätigung ${CONFIG.event.name.de}`;
  const ticketLines = tickets
    .map((t) => `* ${t.name}: ${formatCurrency(t.fullPrice, "EUR", "de")}`)
    .join("\n");

  const body = `(English version below)

Liebe/r ${fullName},

du hast für ${CONFIG.event.preferredArticle.de} ${
    CONFIG.event.name.de
  } folgende Tickets bestellt:

${ticketLines}

Außerdem hast du uns folgenden Kommentar hinterlassen: ${comment}

${maybeWireTransfer(BANK_TRANSFER_DEADLINE, totalPrice, paymentReason, "de")}

Wir freuen uns Dich auf der Convention zu sehen.
Viele Grüße,
Dein Orgateam


-------English-------


Dear ${fullName},

you ordered the following tickets for ${CONFIG.event.name["en-US"]}:

${ticketLines}

You sent us the following comment: ${comment}

${maybeWireTransfer(BANK_TRANSFER_DEADLINE, totalPrice, paymentReason, "en-US")}

We're looking forward to meeting you at the convention!
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
  const subject = `${CONFIG.event.name.de}: Bezahlung erhalten`;

  const body = `(English version below)

Liebe/r ${fullName},

wir haben deine Zahlung über ${receivedAmount} erhalten. Vielen Dank!

Wir freuen uns Dich auf der Convention zu sehen.
Viele Grüße,
Dein Orgateam


-------English-------


Dear ${fullName},

we've received your payment of ${receivedAmount}.

We're looking forward to meeting you at the convention!
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
  const subject = `Zahlungserinnerung ${CONFIG.event.name.de}`;
  const ticketLines = tickets
    .map((t) => `* ${t.name}: ${formatCurrency(t.fullPrice, "EUR", "de")}`)
    .join("\n");

  const body = `(English version below)

Liebe/r ${fullName},

${CONFIG.event.preferredArticle.de} ${
    CONFIG.event.name.de
  } steht vor der Tür, bitte denk daran uns noch den Teilnahmebeitrag zu überweisen.
Falls du doch nicht kommen kannst oder eigentlich schon überwiesen hast, gib uns bitte Bescheid.

Zur Erinnerung, du hattest folgende Tickets bestellt:

${ticketLines}

${maybeWireTransfer(BANK_TRANSFER_DEADLINE, totalPrice, paymentReason, "de")}

Wir freuen uns Dich auf der Convention zu sehen!
Viele Grüße,
Dein Orgateam


-------English-------


Dear ${fullName},

${CONFIG.event.preferredArticle["en-US"]} ${
    CONFIG.event.name["en-US"]
  } is right around the corner. Please remember to pay your tickets.
If you can't make it to the convention or if you have already paid, please drop us a line.

You ordered the following tickets:

${ticketLines}

${maybeWireTransfer(BANK_TRANSFER_DEADLINE, totalPrice, paymentReason, "en-US")}

We're looking forward to meeting you at the convention!
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

function bankDetails(
  totalPrice: string,
  paymentReason: string,
  language: SupportedLocales
): string {
  switch (language) {
    case "de":
      return `Empfänger: ${CONFIG.event.bankDetails.accountHolder}
Bank: ${CONFIG.event.bankDetails.bankName}
IBAN: ${CONFIG.event.bankDetails.iban}
BIC: ${CONFIG.event.bankDetails.bic}
Betrag: ${totalPrice}
Verwendungszweck: ${paymentReason}`;
    case "en-US":
      return `Recipient: ${CONFIG.event.bankDetails.accountHolder}
Bank: ${CONFIG.event.bankDetails.bankName}
IBAN: ${CONFIG.event.bankDetails.iban}
BIC: ${CONFIG.event.bankDetails.bic}
Amount: ${totalPrice}
Reference: ${paymentReason}`;
    default:
      assertNever(language);
  }
}

function maybeWireTransfer(
  deadline: Day,
  totalPrice: string,
  paymentReason: string,
  language: SupportedLocales
): string {
  const shouldPayBeforehand = deadline.gt(Day.now());
  if (shouldPayBeforehand) {
    switch (language) {
      case "de":
        return `Bitte überweise das Geld dafür bis zum ${formatLongDate(
          deadline,
          "de"
        )} auf unser Konto:

${bankDetails(totalPrice, paymentReason, language)}`;
      case "en-US":
        return `Please transfer the money to our account by ${formatLongDate(
          deadline,
          "en-US"
        )}:

${bankDetails(totalPrice, paymentReason, language)}`;
      default:
        assertNever(language);
    }
  } else {
    switch (language) {
      case "de":
        return "Bitte bezahle den Betrag vor Ort in bar.";
      case "en-US":
        return `Please pay the amount at the site in cash`;
      default:
        assertNever(language);
    }
  }
}
