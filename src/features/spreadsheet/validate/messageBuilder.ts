import { ContainerBuilder } from "discord.js";
import {
  SpreadsheetValidationError,
  SpreadsheetValidationResult,
  ValidatedRow,
} from "src/features/spreadsheet/types.js";
import { SPREADSHEET_MESSAGES } from "src/features/spreadsheet/validate/messages.js";
import { ContainerStyle, MessageBlock } from "types/container.js";
import { buildContainers } from "utils/containers/containersBuilder.js";
import {
  createContentBlock,
  createMainHeader,
} from "utils/containers/containersUtils.js";

export function buildValidateSpreadsheetContainers(
  validationResult: SpreadsheetValidationResult,
  totalRows: number,
): ContainerBuilder[] {
  const blocks: MessageBlock[] = [];

  // Main header block
  blocks.push(createMainHeader(SPREADSHEET_MESSAGES.MAIN_HEADER));

  const validRows: number = validationResult.validatedRows.filter(
    (row: ValidatedRow): boolean => row.isValid,
  ).length;

  const populatableRows: number = validationResult.populatableRows.length;

  // Main summary block
  blocks.push(
    createContentBlock(
      SPREADSHEET_MESSAGES.summaryContentBlockContent(
        validRows,
        totalRows,
        populatableRows,
        validationResult,
      ),
    ),
  );

  // Content block for validation errors
  if (validationResult.errorsByRow.size > 0) {
    const issueContent: string[] = [];

    Array.from(validationResult.errorsByRow.entries())
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

          rowIssues.push(SPREADSHEET_MESSAGES.rowNumber(rowNumber));

          errors.forEach((error: SpreadsheetValidationError): void => {
            rowIssues.push(
              SPREADSHEET_MESSAGES.rowIssues(error.message.trim()),
            );
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
        SPREADSHEET_MESSAGES.contentBlockHeader(
          validationResult.errorsByRow.size,
        ),
      ),
    );
  }

  // Set style for container accordingly
  const style: ContainerStyle =
    validationResult.errorsByRow.size > 0
      ? ContainerStyle.ERROR
      : ContainerStyle.SUCCESS;

  return buildContainers(style, blocks);
}
