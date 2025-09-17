import { Config, getConfig, GuildConfig } from "config/configLoader.js";
import {
  getGoogleCredentials,
  GoogleCredentials,
} from "config/googleCredentialsLoader.js";
import { LOADER_MESSAGE } from "constants/messages/loaderMessages.js";
import { Auth, google, sheets_v4 } from "googleapis";
import {
  reportValidationResult,
  ValidationReport,
} from "utils/validationUtils.js";

let googleCredentialsErrors: Record<string, string[]> = {};

// Getter for Google credentials errors
export function getGoogleCredentialsErrors(): Record<string, string[]> {
  return googleCredentialsErrors;
}

// Helper function to report Google credentials validation errors or success
export function reportGoogleCredentialsValidation(
  errorsByGuild: Record<string, string[]>,
  context: "reload" | "validate",
): ValidationReport {
  return reportValidationResult(
    errorsByGuild,
    context,
    {
      reload: LOADER_MESSAGE.G_C_RELOADED_AND_VALIDATED_SUCCESSFULLY,
      validate: LOADER_MESSAGE.G_C_VALIDATED_SUCCESSFULLY,
    },
    "Google credentials",
    "Guild",
  );
}

// Setter for Google credentials errors
export function setGoogleCredentialsErrors(
  errors: Record<string, string[]>,
): void {
  googleCredentialsErrors = errors;
}

// Function that validates the values in all the Google credentials files
export async function validateGoogleCredentials(): Promise<
  Record<string, string[]>
> {
  const errorsByGuild: Record<string, string[]> = {};
  const credentials: Record<string, GoogleCredentials> = getGoogleCredentials();
  const config: Config = getConfig();

  for (const guildID in credentials) {
    const credential: GoogleCredentials = credentials[guildID];
    const guildConfig: GuildConfig = config.GUILDS[guildID];
    const errors: string[] = [];

    try {
      const auth = new Auth.GoogleAuth({
        credentials: credential,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });

      const sheets: sheets_v4.Sheets = google.sheets({ auth, version: "v4" });

      await sheets.spreadsheets.get({
        includeGridData: false,
        spreadsheetId: guildConfig.SPREADSHEET_ID,
      });
    } catch (err) {
      if (err && typeof err === "object" && "message" in err) {
        errors.push(LOADER_MESSAGE.googleSheetsAPIError(err));
      } else {
        errors.push(LOADER_MESSAGE.googleSheetsAPIError(err));
      }
    }

    errorsByGuild[guildID] = errors;
  }

  setGoogleCredentialsErrors(errorsByGuild);

  return errorsByGuild;
}
