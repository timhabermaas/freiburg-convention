import { DaySchema, assertDefined, dayRange } from "./utils";
import * as fs from "fs";
import { z } from "zod";
import { Day } from "./domain/types";

const translatedSchema = z.object({ de: z.string(), "en-US": z.string() });

const eventConfigSchema = z.object({
  name: translatedSchema,
  preferredArticle: translatedSchema,
  start: DaySchema,
  end: DaySchema,
  wireTransferDeadline: DaySchema,
  senderMail: z.object({ displayName: z.string(), address: z.string() }),
  eventHomepage: z.string(),
  tickets: z.array(
    z.object({
      id: z.string(),
      from: DaySchema,
      to: DaySchema,
      price: z.number(),
    })
  ),
  bankDetails: z.object({
    accountHolder: z.string(),
    iban: z.string(),
    bic: z.string(),
    bankName: z.string(),
  }),
});
type EventConfig = Omit<z.infer<typeof eventConfigSchema>, "conventionDays"> & {
  conventionDays: Day[];
};

export interface Config {
  mailSender: "SES" | "CONSOLE";
  eventStore: "file_store" | "s3_store";
  bucketName: string;
  eventStorePath: string;
  adminPassword: string;
  sessionSecret: string;
  statsAccessKey?: string;
  printAccessKey?: string;
  event: EventConfig;
}

function getConfigFromEnvAndFile(): Config {
  const parsedEventConfig = eventConfigSchema.parse(
    JSON.parse(fs.readFileSync("./config/eventConfig.json").toString())
  );
  const eventConfig = {
    ...parsedEventConfig,
    conventionDays: dayRange(parsedEventConfig.start, parsedEventConfig.end),
  };

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
    bucketName:
      process.env.EVENT_STORE_BUCKET_NAME ?? "jonglieren-in-freiburg-dev",
    event: eventConfig,
  };
}

export const CONFIG: Config = getConfigFromEnvAndFile();
