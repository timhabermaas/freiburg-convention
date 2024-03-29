import path from "path";
import express from "express";
import compression from "compression";
import winston from "winston";
import expressWinston from "express-winston";
import slowDown from "express-slow-down";
import { createRequestHandler } from "@remix-run/express";
import { FileStore } from "./app/services/stores/file-store";
import { S3Store } from "./app/services/stores/s3-store";
import { SesSender } from "./app/services/email/ses-sender";
import { ConsoleSender } from "./app/services/email/console-sender";
import { logger } from "./app/logger";
import { App } from "./app/domain/app.server";
import { CONFIG } from "./app/config.server";

import * as build from "@remix-run/dev/server-build";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const BROWSER_BUILD_DIR = "/build/";

const app = express();
app.use(compression());

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 1000, // allow 1000 requests per 15 minutes, then...
  delayMs: 50, // begin adding 50ms of delay per request above 1000:
});
app.use(speedLimiter);

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

app.use(
  express.static("public", {
    setHeaders(res, pathname) {
      const relativePath = pathname.replace(PUBLIC_DIR, "");
      res.setHeader(
        "Cache-Control",
        relativePath.startsWith(BROWSER_BUILD_DIR)
          ? // Remix fingerprints its assets so we can cache forever
            "public, max-age=31536000, immutable"
          : // You may want to be more aggressive with this caching
            "public, max-age=3600"
      );
    },
  })
);

let eventStore;

if (CONFIG.eventStore === "file_store") {
  eventStore = new FileStore(CONFIG.eventStorePath);
} else if (CONFIG.eventStore === "s3_store") {
  eventStore = new S3Store("events", CONFIG.bucketName);
} else {
  throw new Error("unknown event store");
}

let mailSender;

if (CONFIG.mailSender === "SES") {
  mailSender = new SesSender();
} else {
  mailSender = new ConsoleSender();
}

let APP = new App(eventStore, mailSender);
APP.replay();

app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(
        (msg) => `[Express] ${msg.timestamp} ${msg.level}: ${msg.message}`
      )
    ),
    meta: true,
    defaultMeta: { module: "Express" },
    msg: "HTTP  ",
    expressFormat: true,
    colorize: false,
    ignoreRoute: function (req, res) {
      return false;
    },
  })
);

app.get("/api/reset", (req, res) => {
  if (CONFIG.eventStore === "file_store") {
    APP.reset();
  } else {
    res.status(405).send("NOT ALLOWED");
  }
  res.send("OK");
});

app.all(
  "*",
  createRequestHandler({
    build,
    mode: process.env.NODE_ENV,
    getLoadContext: () => {
      return { app: APP, eventStore };
    },
  })
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`Express server listening on port ${port}`);
});
