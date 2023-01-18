import { assertDefined } from "./utils";

export interface Config {
  mailSender: "SES" | "CONSOLE";
  eventStore: "file_store" | "s3_store";
  eventStorePath: string;
  adminPassword: string;
  sessionSecret: string;
  statsAccessKey?: string;
  printAccessKey?: string;
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
    eventStorePath: process.env.EVENT_STORE_PATH ?? "temp/store.log",
    adminPassword: process.env.ADMIN_PASSWORD ?? "admin",
    sessionSecret: assertDefined(process.env.SESSION_SECRET, "SESSION_SECRET"),
    statsAccessKey: process.env.STATS_ACCESS_KEY,
    printAccessKey: process.env.PRINT_ACCESS_KEY,
  };
}

export const CONFIG: Config = getConfigFromEnv();
