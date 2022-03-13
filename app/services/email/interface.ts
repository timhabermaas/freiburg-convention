import { Mail } from "~/domain/types";

export interface MailSender {
  send(mail: Mail): Promise<void>;
}
