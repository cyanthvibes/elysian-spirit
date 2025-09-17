import { EMOJIS } from "constants/emojis.js";

export const ELYSIAN_SPIRIT_CLIENT_MESSAGES = {
  botReady: (tag: string | undefined): string =>
    `${EMOJIS.SUCCESS} Bot is ready as ${tag}`,

  errorDuringClientInitialisation: (err: unknown): string => {
    return `${EMOJIS.ERROR} Error during init:
    ${err}`;
  },

  errorDuringClientLogin: (err: unknown): string => {
    return `${EMOJIS.ERROR} Error logging in bot:
    ${err}`;
  },

  SUCCESSFUL_LOGIN: `${EMOJIS.SUCCESS} Bot successfully logged in`,
} as const;
