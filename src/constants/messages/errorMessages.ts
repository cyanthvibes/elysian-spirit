import { EMOJIS } from "constants/emojis.js";
import { AutocompleteInteraction } from "discord.js";

export const ERROR_MESSAGES = {
  SOMETHING_WENT_WRONG: `${EMOJIS.ERROR} An unexpected error occurred. Please try again later.`,

  unexpectedAutocompleteInteractionError: (
    err: unknown,
    interaction: AutocompleteInteraction,
  ): string =>
    [
      `Unexpected error: ${err instanceof Error ? err.stack : String(err)}`,
      `${interaction}`,
    ].join("\n"),

  unexpectedError: (err: unknown): string =>
    `Unexpected error: ${err instanceof Error ? err.stack : String(err)}`,

  unexpectedInteractionError: (err: unknown): string =>
    [`Error handling interaction error:`, `${err}`].join("\n"),

  unexpectedMessageError: (err: unknown): string =>
    [`Error handling message command error:`, `${err}`].join("\n"),
} as const;
