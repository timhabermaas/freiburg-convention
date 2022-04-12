import { assertDefined } from "./utils";

export interface Config {
  mailSender: "SES" | "CONSOLE";
  eventStore: "file_store" | "s3_store";
  adminPassword: string;
  sessionSecret: string;
}

function getConfigFromEnv(): Config {
  return {
    mailSender: process.env.MAIL_SENDER === "SES" ? "SES" : "CONSOLE",
    eventStore:
      process.env.EVENT_STORE === "file_store"
        ? "file_store"
        : process.env.EVENT_STORE === "s3_store" ||
          process.env.NODE_ENV === "production"
        ? "s3_store"
        : "file_store",
    adminPassword: process.env.ADMIN_PASSWORD ?? "admin",
    sessionSecret: assertDefined(process.env.SESSION_SECRET),
  };
}

export const CONFIG: Config = getConfigFromEnv();
