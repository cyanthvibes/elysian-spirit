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

  errorFetchingMembers: (name: string, guildID: string, err: unknown): string =>
    [
      `${EMOJIS.ERROR} Failed to fetch all members for guild ${name} ${guildID}:`,
      `${err}`,
    ].join("\n"),

  fetchedMembers: (name: string, guildID: string): string =>
    `${EMOJIS.SUCCESS} Fetched all members for guild ${name} ${guildID}`,

  fetchingGuildMembers: (name: string, guildID: string): string =>
    `${EMOJIS.CHECKING} Fetching all members for guild ${name} ${guildID}`,

  SUCCESSFUL_LOGIN: `${EMOJIS.SUCCESS} Bot successfully logged in`,
} as const;
