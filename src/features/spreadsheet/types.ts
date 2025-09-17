import { sheets_v4 } from "googleapis";

import Sheets = sheets_v4.Sheets;

export enum ValidationErrorType {
  ALT_DUPLICATE = "ALT_DUPLICATE",
  ALT_USED_AS_RSN = "ALT_USED_AS_RSN",
  AMBIGUOUS_DISCORD_MATCH = "AMBIGUOUS_DISCORD_MATCH",
  DISCORD_ID_DUPLICATE = "DISCORD_ID_DUPLICATE",
  INCORRECT_DISCORD_ID = "INCORRECT_DISCORD_ID",
  MISSING_RSN = "MISSING_RSN",
  MULTIPLE_RSNS = "MULTIPLE_RSNS",
  NO_DISCORD_MATCH = "NO_DISCORD_MATCH",
  RSN_DUPLICATE = "RSN_DUPLICATE",
  RSN_USED_AS_ALT = "RSN_USED_AS_ALT",
}

export interface DiscordMemberInfo {
  displayName: string;
  id: string;
  parsedNames: ParsedDiscordName;
}

export interface GoogleSheetsAPI {
  getValues: (range: string) => Promise<string[][]>;
  sheets: Sheets;
  spreadsheetID: string;
  updateValues: (range: string, values: string[][]) => Promise<void>;
}

export interface ParsedDiscordName {
  alts: string[];
  rsn: string;
}

export interface PopulationSummary {
  errorsByRow: Map<number, SpreadsheetValidationError[]>;
  populatedCount: number;
  totalRows: number;
}

export interface SpreadsheetRow {
  alts: string;
  discordID: string;
  row: number;
  rsn: string;
}

export interface SpreadsheetValidationError {
  altIndex?: number;
  message: string;
  type: ValidationErrorType;
}

export interface SpreadsheetValidationResult {
  errorsByRow: Map<number, SpreadsheetValidationError[]>;
  populatableRows: ValidatedRow[];
  validatedRows: ValidatedRow[];
}

export interface ValidatedRow {
  canPopulate: boolean;
  errors: SpreadsheetValidationError[];
  expectedDiscordID?: string;
  isValid: boolean;
  row: SpreadsheetRow;
}
