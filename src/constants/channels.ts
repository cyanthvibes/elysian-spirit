export const CHANNEL_KEYS = {
  BOT_CHANNEL: "BOT_CHANNEL",
} as const;

export type CHANNEL_KEY = keyof typeof CHANNEL_KEYS;
