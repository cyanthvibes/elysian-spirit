import { EMOJIS } from "constants/emojis.js";
import { bold } from "discord.js";
import { PopulationSummary } from "src/features/spreadsheet/types.js";
import { pluralise } from "utils/formatUtils.js";

export const POPULATE_MESSAGES = {
  FIRST_REPLY_HEADER: `${EMOJIS.CHECKING} Populating spreadsheet...`,

  issuesFound: (count: number): string => {
    return `${EMOJIS.ERROR} ${bold(`${pluralise(count, "Issue")} found in the spreadsheet:`)}`;
  },

  MAIN_HEADER: `${EMOJIS.SUMMARY} ${bold("Populating spreadsheet results")}`,

  rowIssues: (issue: string): string => `- ${issue}`,

  rowNumber: (rowNumber: number): string => `${bold(`Row ${rowNumber}`)}:`,

  summaryContentBlockContent: (summary: PopulationSummary): string => {
    return summary.errorsByRow.size > 0
      ? `${EMOJIS.ERROR} ${bold(String(summary.errorsByRow.size))} ${pluralise(summary.errorsByRow.size, "issue")} found`
      : `${EMOJIS.SUCCESS} No issues found`;
  },

  summaryContentBlockHeader: (summary: PopulationSummary): string => {
    return `${EMOJIS.INFO} Populated ${bold(String(summary.populatedCount))} ${pluralise(summary.populatedCount, "row")} out of ${bold(String(summary.totalRows))} ${pluralise(summary.populatedCount, "row")}`;
  },
} as const;
