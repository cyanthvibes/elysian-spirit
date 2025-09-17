import "winston-daily-rotate-file";
import { TransformableInfo } from "logform";
import { createLogger, format, Logger, transports } from "winston";

// Winston format when printing to console
const consoleFormat = format.combine(
  format.colorize(),
  format.errors({ stack: true }),
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf((info: TransformableInfo): string => {
    return `[${info.timestamp}] [${info.level}]: ${info.stack || info.message}`;
  }),
);

// Winston transport using a custom format
const consoleTransport = new transports.Console({
  format: consoleFormat,
});

// Winston format when logging to a file
const fileFormat = format.combine(
  format.prettyPrint({ depth: 5 }),
  format.errors({ stack: true }),
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf((info: TransformableInfo): string => {
    return `[${info.timestamp}] [${info.level}]: ${info.stack || info.message}`;
  }),
);

// Winston transport using custom format and winston-daily-rotate-file
const fileTransport = new transports.DailyRotateFile({
  datePattern: "YYYY-MM-DD",
  dirname: "logs",
  filename: "%DATE%.log",
  format: fileFormat,
  level: "info",
  maxFiles: "14d",
});

export const logger: Logger = createLogger({
  level: "info",
  transports: [consoleTransport, fileTransport],
});

// In logger.ts, add error handlers
fileTransport.on("error", (error: Error): void => {
  console.error("File transport error:", error);
});

consoleTransport.on("error", (error: Error): void => {
  console.error("Console transport error:", error);
});
