import { BOT_STARTUP_MESSAGES } from "constants/messages/botStartupMessages.js";

const { logger } = await import("utils/logger.js");

try {
  await import("config/envLoader.js");
  await import("config/configLoader.js");
  await import("config/googleCredentialsLoader.js");

  const { dirname, resolve } = await import("path");
  const { fileURLToPath } = await import("url");

  // Resolve the directory name of the current file
  const __dirname: string = dirname(fileURLToPath(import.meta.url));

  // Determine the bot file path based on the environment (.ts for dev, .js for production)
  const pathToBotFile: string = resolve(
    __dirname,
    process.env.NODE_ENV === "development" ? "bot.ts" : "bot.js",
  );

  // Dynamically import and run the bot
  import(pathToBotFile);
} catch (err) {
  logger.error(BOT_STARTUP_MESSAGES.startupError(err));
  process.kill(process.ppid);
}

// Handle process-level errors to prevent crashes
process
  .on("unhandledRejection", (err: unknown): void => {
    logger.error(BOT_STARTUP_MESSAGES.unhandledrejection(err));
  })
  .on("uncaughtException", (err: Error): void => {
    logger.error(BOT_STARTUP_MESSAGES.uncaughtException(err));
  })
  .on("uncaughtExceptionMonitor", (err: Error): void => {
    logger.error(BOT_STARTUP_MESSAGES.uncaughtExceptionMonitor(err));
  })
  .on("error", (err: unknown): void => {
    logger.error(BOT_STARTUP_MESSAGES.error(err));
  });
