import { getGuildConfig } from "config/configUtils.js";
import {
  getGoogleCredentials,
  GoogleCredentials,
} from "config/googleCredentialsLoader.js";
import { Auth, google, sheets_v4 } from "googleapis";
import { GoogleSheetsAPI } from "src/features/spreadsheet/types.js";

import Sheets = sheets_v4.Sheets;

// Function that builds spreadsheet range string for API queries
export function createRange(
  startColumn: string,
  startRow: number,
  endColumn: string,
  sheetName: string,
  endRow?: number,
): string {
  return endRow
    ? `${sheetName}!${startColumn}${startRow}:${endColumn}${endRow}`
    : `${sheetName}!${startColumn}${startRow}:${endColumn}`;
}

// Function that returns Google Sheets API methods
export async function getGoogleSheets(
  guildID: string,
): Promise<GoogleSheetsAPI> {
  const credentials: GoogleCredentials = getGoogleCredentials()[guildID];

  const auth = new Auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets: Sheets = google.sheets({ auth, version: "v4" });
  const spreadsheetID: string = getGuildConfig(guildID)?.SPREADSHEET_ID ?? "";

  // Return API methods
  return {
    getValues: async (range: string): Promise<string[][]> => {
      const response = await sheets.spreadsheets.values.get({
        range,
        spreadsheetId: spreadsheetID,
      });

      return response.data.values ?? [];
    },
    sheets,
    spreadsheetID: spreadsheetID,
    updateValues: async (range: string, values: string[][]): Promise<void> => {
      await sheets.spreadsheets.values.update({
        range,
        requestBody: { values },
        spreadsheetId: spreadsheetID,
        valueInputOption: "USER_ENTERED",
      });
    },
  };
}
