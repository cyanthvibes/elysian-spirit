import { EMOJIS } from "constants/emojis.js";
import { inlineCode } from "discord.js";

export const UNDO_MESSAGES = {
  undoneLine: (transactionID: string): string => {
    return `${EMOJIS.SUCCESS} Transaction ${inlineCode(transactionID)} has been undone.`;
  },
} as const;
