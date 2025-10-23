import { EMOJIS } from "constants/emojis.js";
import { pluralise } from "utils/formatUtils.js";

export interface ValidationReport {
  hasErrors: boolean;
  message: string;
}

// Helper function that formats validation errors
export function formatValidationErrors(
  errorsByKey: Record<string, string[]>,
  keyLabel = "Guild",
): null | string {
  const errorEntries: [string, string[]][] = Object.entries(errorsByKey).filter(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_, errors]: [string, string[]]): boolean => errors.length > 0,
  );

  if (errorEntries.length === 0) return null;

  return errorEntries
    .map(([key, errors]: [string, string[]]): string =>
      [
        `${keyLabel} ${key}:`,
        `${errors.map((error: string): string => `- ${error}`).join("\n")}`,
      ].join("\n"),
    )
    .join("\n\n");
}

// Helper function that builds the validation result message
export function reportValidationResult(
  errorsByKey: Record<string, string[]>,
  context: "reload" | "validate",
  successMessages: { reload: string; validate: string },
  errorMessagePrefix: string,
  keyLabel = "Guild",
): ValidationReport {
  const errorLog: null | string = formatValidationErrors(errorsByKey, keyLabel);
  const errorCount: number = errorLog
    ? errorLog.split(`${EMOJIS.ERROR} ${keyLabel} `).length - 1
    : 0;

  if (errorLog) {
    const message: string =
      context === "reload"
        ? [
            `${errorMessagePrefix} reloaded with ${pluralise(errorCount, "error")}:`,
            `${errorLog}`,
          ].join("\n")
        : [
            `${EMOJIS.ERROR} ${pluralise(errorCount, "Error")} found in ${errorMessagePrefix}:`,
            `${errorLog}`,
          ].join("\n");

    return { hasErrors: true, message };
  }

  return {
    hasErrors: false,
    message: successMessages[context],
  };
}
