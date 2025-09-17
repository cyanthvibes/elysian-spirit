import { ContainerBuilder } from "discord.js";
import { POPULATE_MESSAGES } from "src/features/spreadsheet/populate/messages.js";
import {
  PopulationSummary,
  SpreadsheetValidationError,
} from "src/features/spreadsheet/types.js";
import { ContainerStyle, MessageBlock } from "types/container.js";
import { buildContainers } from "utils/containers/containersBuilder.js";
import {
  createContentBlock,
  createMainHeader,
} from "utils/containers/containersUtils.js";

export function buildPopulateSpreadsheetContainers(
  summary: PopulationSummary,
): ContainerBuilder[] {
  const blocks: MessageBlock[] = [];

  // Main header block
  blocks.push(createMainHeader(POPULATE_MESSAGES.MAIN_HEADER));

  // Main summary block
  blocks.push(
    createContentBlock(
      [POPULATE_MESSAGES.summaryContentBlockContent(summary)],
      POPULATE_MESSAGES.summaryContentBlockHeader(summary),
    ),
  );

  // Content block for validation errors
  if (summary.errorsByRow.size > 0) {
    const issueContent: string[] = [];

    Array.from(summary.errorsByRow.entries())
      .sort(
        (
          [a]: [number, SpreadsheetValidationError[]],
          [b]: [number, SpreadsheetValidationError[]],
        ): number => a - b,
      )
      .forEach(
        (
          [rowNumber, errors]: [number, SpreadsheetValidationError[]],
          index: number,
          array: [number, SpreadsheetValidationError[]][],
        ): void => {
          const rowIssues: string[] = [];

          rowIssues.push(POPULATE_MESSAGES.rowNumber(rowNumber));

          errors.forEach((error: SpreadsheetValidationError): void => {
            rowIssues.push(POPULATE_MESSAGES.rowIssues(error.message.trim()));
          });

          let rowContent: string = rowIssues.join("\n");

          // Add blank line after each row except the last one
          if (index < array.length - 1) {
            rowContent += "\n";
          }

          issueContent.push(rowContent);
        },
      );

    blocks.push(
      createContentBlock(
        issueContent,
        POPULATE_MESSAGES.issuesFound(summary.errorsByRow.size),
      ),
    );
  }

  // Set style for container accordingly
  const style: ContainerStyle =
    summary.errorsByRow.size > 0
      ? ContainerStyle.ERROR
      : ContainerStyle.SUCCESS;

  return buildContainers(style, blocks);
}
