import { GuildConfig } from "config/configLoader.js";
import { getGuildConfig } from "config/configUtils.js";
import { createRange, getGoogleSheets } from "src/features/spreadsheet/API.js";
import { SpreadsheetRow } from "src/features/spreadsheet/types.js";
import { SPREADSHEET_MESSAGES } from "src/features/spreadsheet/validate/messages.js";
import { normaliseName, parseAlts } from "utils/parseUtils.js";

// Function that returns all normalised names from a row in the spreadsheet
export function getAllNormalisedNames(row: SpreadsheetRow): string[] {
  const normalisedRSN: string = normaliseName(row.rsn);
  const normalisedALTs: string[] = parseAlts(row.alts);

  const allNames: string[] = [];

  if (normalisedRSN) {
    allNames.push(normalisedRSN);
  }
  allNames.push(...normalisedALTs);

  return allNames;
}

// Helper function to check if a row in the spreadsheet is completely empty
export function isEmptyRow(row: SpreadsheetRow): boolean {
  return !row.rsn.trim() && !row.alts.trim() && !row.discordID.trim();
}

// Function that reads data from spreadsheet and returns array of rows
export async function readSpreadsheetData(
  guildID: string,
): Promise<SpreadsheetRow[]> {
  // Get Google Sheets API
  const { getValues } = await getGoogleSheets(guildID);

  // Get config for this guild
  const guildConfig: GuildConfig = getGuildConfig(guildID);

  // Get sheet information from guild config
  const { ALTS, DISCORD_ID, RSN } = guildConfig.SPREADSHEET_COLUMNS;
  const { END_ROW, START_ROW } = guildConfig.SPREADSHEET_ROWS;
  const sheetName: string = guildConfig.SPREADSHEET_SHEET;

  // Build sheet ranges
  const rsnRange: string = createRange(RSN, START_ROW, RSN, sheetName, END_ROW);
  const discordIDRange: string = createRange(
    DISCORD_ID,
    START_ROW,
    DISCORD_ID,
    sheetName,
    END_ROW,
  );
  const altRange: null | string = ALTS
    ? createRange(ALTS, START_ROW, ALTS, sheetName, END_ROW)
    : null;

  // Read spreadsheet data
  const rsnRows: string[][] = await getValues(rsnRange);
  const discordIDRows: string[][] = await getValues(discordIDRange);
  const altRows: string[][] = altRange ? await getValues(altRange) : [];

  // Determine the highest row count
  const rowCount: number = Math.max(
    rsnRows.length,
    discordIDRows.length,
    altRows.length,
  );

  const rows: SpreadsheetRow[] = [];

  // Put the columns together into an array of rows
  for (let i = 0; i < rowCount; i++) {
    rows.push({
      alts: (altRows[i]?.[0] ?? "").trim(),
      discordID: (discordIDRows[i]?.[0] ?? "").trim(),
      row: START_ROW + i,
      rsn: (rsnRows[i]?.[0] ?? "").trim(),
    });
  }

  return rows;
}

// Helper function to add RSN/ALT to names
export const createNameDescription: (
  row: SpreadsheetRow,
  names: string[],
) => string = (row: SpreadsheetRow, names: string[]): string => {
  const descriptions: string[] = [];
  const normalisedRSN: string = normaliseName(row.rsn);
  const normalisedALTs: string[] = parseAlts(row.alts);

  names.forEach((name: string): void => {
    if (name === normalisedRSN) {
      descriptions.push(SPREADSHEET_MESSAGES.rsn(name));
    } else if (normalisedALTs.includes(name)) {
      descriptions.push(SPREADSHEET_MESSAGES.alt(name));
    } else {
      descriptions.push(SPREADSHEET_MESSAGES.fallback(name)); // fallback
    }
  });

  return descriptions.join(", ");
};
