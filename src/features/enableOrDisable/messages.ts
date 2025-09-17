import { EMOJIS } from "constants/emojis.js";

export const ENABLE_OR_DISABLE_MESSAGE = {
  actionMessage: (bool: boolean): string =>
    `${EMOJIS.CHECKING} ${bool ? "Enabling" : "Disabling"} commands...`,

  resultMessage: (bool: boolean): string =>
    `${bool ? EMOJIS.SUCCESS : EMOJIS.ERROR} Commands ${bool ? "enabled!" : "disabled!"}`,
} as const;
