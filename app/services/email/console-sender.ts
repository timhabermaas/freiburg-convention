import { Mail } from "~/domain/types";
import { MailSender } from "./interface";

export class ConsoleSender implements MailSender {
  send(mail: Mail): void {
    console.log("===sending email===");
    console.log(`From: ${mail.from}`);
    console.log(`Cc: ${mail.cc}`);
    console.log(`To: ${mail.to}`);
    console.log(`Subject: ${mail.subject}`);
    console.log("");
    console.log(mail.body);
    console.log("");
    console.log("===end sending email===");
  }
}
