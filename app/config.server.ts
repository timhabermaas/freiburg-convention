export interface Config {
  mailSender: "SES" | "CONSOLE";
  eventStore: "file_store" | "s3_store";
}

function getConfigFromEnv(): Config {
  return {
    mailSender: process.env.MAIL_SENDER === "SES" ? "SES" : "CONSOLE",
    eventStore:
      process.env.EVENT_STORE === "s3_store" ||
      process.env.NODE_ENV === "production"
        ? "s3_store"
        : "file_store",
  };
}

export const CONFIG: Config = getConfigFromEnv();
