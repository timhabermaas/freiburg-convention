import { SES } from "aws-sdk";
import { Mail } from "~/domain/types";
import { MailSender } from "./interface";

export class SesSender implements MailSender {
  private ses: SES;

  constructor() {
    this.ses = new SES({ apiVersion: "2010-12-01", region: "eu-central-1" });
  }

  public send(mail: Mail): void {
    return;
    this.ses
      .sendEmail({
        Source: mail.from,
        Destination: {
          ToAddresses: mail.to,
          CcAddresses: mail.cc,
        },
        Message: {
          Body: {
            Text: {
              Charset: "UTF-8",
              Data: mail.body,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: mail.subject,
          },
        },
      })
      .promise();
  }
}
