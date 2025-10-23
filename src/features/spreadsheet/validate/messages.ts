import { EMOJIS } from "constants/emojis.js";
import { bold, inlineCode } from "discord.js";
import {
  SpreadsheetRow,
  SpreadsheetValidationResult,
} from "src/features/spreadsheet/types.js";
import { createNameDescription } from "src/features/spreadsheet/utils.js";
import { pluralise } from "utils/formatUtils.js";

export const SPREADSHEET_MESSAGES = {
  alt: (name: string): string => `ALT: ${inlineCode(name)}`,

  altDuplicate: (originalALT: string, altRows: number[]): string => {
    return `ALT ${inlineCode(originalALT)} is also used as an ALT in ${pluralise(altRows.length, "row")} ${altRows.join(", ")}`;
  },

  altUsedAsRSN: (originalALT: string, rsnRows: number[]): string => {
    return `ALT ${inlineCode(originalALT)} is also used as an RSN in ${pluralise(rsnRows.length, "row")} ${rsnRows.join(", ")}`;
  },

  ambiguousDiscordMatch: (
    row: SpreadsheetRow,
    ambiguousMatches: string[],
    memberMentions: string,
  ): string => {
    return `Multiple Discord members have the ${createNameDescription(row, ambiguousMatches)} in their display name: ${memberMentions}`;
  },

  contentBlockHeader: (count: number): string => {
    return `${EMOJIS.ERROR} ${bold(`${pluralise(count, "Issue")} found in the spreadsheet`)}:`;
  },

  discordIDDuplicate: (discordID: string): string => {
    return `Discord ID ${inlineCode(discordID)} appears multiple times in the spreadsheet`;
  },

  fallback: (name: string): string => inlineCode(name),

  FIRST_REPLY_HEADER: `${EMOJIS.CHECKING} Validating spreadsheet...`,

  incorrectDiscordID: (
    discordID: string,
    discordIDToBePopulated: string,
  ): string => {
    return `Incorrect Discord ID: found ${inlineCode(discordID)}, expected ${inlineCode(discordIDToBePopulated)}`;
  },

  MAIN_HEADER: `${EMOJIS.SUMMARY} ${bold("Spreadsheet validation results")}`,
  MISSING_RSN: "Missing RSN",
  MULTIPLE_RSNS: "More than one RSN",

  noDiscordMatch: (
    row: SpreadsheetRow,
    allNormalisedNames: string[],
  ): string => {
    return `No Discord member matches ${createNameDescription(row, allNormalisedNames)}`;
  },

  rowIssues: (issue: string): string => `- ${issue}`,

  rowNumber: (rowNumber: number): string => `${bold(`Row ${rowNumber}`)}:`,

  rsn: (name: string): string => `RSN: ${inlineCode(name)}`,

  rsnDuplicate: (row: SpreadsheetRow, rsnRows: number[]): string => {
    return `RSN: ${inlineCode(row.rsn)} is also found in ${pluralise(rsnRows.length, "row")} ${rsnRows.join(", ")}`;
  },

  rsnUsedAsALT: (row: SpreadsheetRow, altRows: number[]): string => {
    return `RSN ${inlineCode(row.rsn)} is also used as an ALT in ${pluralise(altRows.length, "row")} ${altRows.join(", ")}`;
  },

  summaryContentBlockContent: (
    validRows: number,
    totalRows: number,
    populatableRows: number,
    validationResult: SpreadsheetValidationResult,
  ): string[] => {
    return [
      `${EMOJIS.INFO} ${bold(String(validRows))} out of ${bold(String(totalRows))} ${pluralise(totalRows, "row")} are valid`,
      `${EMOJIS.INFO} ${bold(String(populatableRows))} ${pluralise(populatableRows, "row")} can be populated`,
      validationResult.errorsByRow.size > 0
        ? `${EMOJIS.ERROR} ${bold(String(validationResult.errorsByRow.size))} ${pluralise(validationResult.errorsByRow.size, "row")} have issues`
        : `${EMOJIS.SUCCESS} No issues found`,
    ];
  },
} as const;
