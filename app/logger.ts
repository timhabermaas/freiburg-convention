import winston from "winston";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(
      (msg) => `[${msg.module}] ${msg.timestamp} ${msg.level}: ${msg.message}`
    )
  ),
  defaultMeta: { service: "user-service" },
  transports: [new winston.transports.Console()],
});
