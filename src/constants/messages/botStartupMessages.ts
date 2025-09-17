export const BOT_STARTUP_MESSAGES = {
  error: (err: unknown): string => {
    return `Process error: ${err instanceof Error ? err.stack : err}`;
  },

  startupError: (err: unknown): string => {
    return `Startup error:
    ${err instanceof Error ? err.stack : err}`;
  },

  uncaughtException: (err: Error): string => {
    return `Uncaught Exception: ${err.stack}`;
  },

  uncaughtExceptionMonitor: (err: Error): string => {
    return `Uncaught Exception Monitor: ${err.stack}`;
  },

  unhandledrejection: (err: unknown): string => {
    return `Unhandled Rejection: ${err instanceof Error ? err.stack : err}`;
  },
} as const;
