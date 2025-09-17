import { getRoleIDs } from "config/configUtils.js";
import { ContainerBuilder, inlineCode, userMention } from "discord.js";
import { SpreadsheetValidationError } from "src/features/spreadsheet/types.js";
import { TEMPLE_MESSAGES } from "src/features/temple/messages.js";
import {
  TempleAwardedMember,
  TempleResult,
} from "src/features/temple/types.js";
import { ContainerStyle, MessageBlock } from "types/container.js";
import { buildContainers } from "utils/containers/containersBuilder.js";
import {
  createContentBlock,
  createFooterBlock,
  createMainHeader,
} from "utils/containers/containersUtils.js";

export function buildTempleResultsContainers(
  guildID: string,
  competitionName: string,
  result: TempleResult,
  isSkillCompetition: boolean,
  transactionID?: string,
  finalBalances?: Map<string, number>,
): ContainerBuilder[] {
  const blocks: MessageBlock[] = [];

  // Main header
  const headerText: string = TEMPLE_MESSAGES.mainHeader(competitionName);

  blocks.push(createMainHeader(headerText));

  const unit: string = TEMPLE_MESSAGES.unit(isSkillCompetition);

  // Results block for awarded members
  if (result.awarded.length > 0) {
    const resultLines: string[] = result.awarded.map(
      (awarded: TempleAwardedMember): string => {
        const memberMention = `${userMention(awarded.discordID)}`;
        const placementsLine: string = TEMPLE_MESSAGES.placementLine(
          awarded.placements,
        );

        const finalBalance: number | undefined = finalBalances?.get(
          awarded.discordID,
        );

        const gainLine: string = TEMPLE_MESSAGES.gainLine(
          awarded.totalGain,
          awarded.cappedPoints,
          awarded.calculatedPoints,
          awarded.capReason,
          unit,
          TEMPLE_MESSAGES.GAIN,
          finalBalance,
        );

        return [memberMention, placementsLine, gainLine]
          .filter(Boolean)
          .join("\n");
      },
    );

    const resultsHeader: string = TEMPLE_MESSAGES.resultsHeader(
      result.awarded.length,
    );

    blocks.push(createContentBlock([resultLines.join("\n\n")], resultsHeader));
  }

  // Check if no one is eligible for any points (no results and no issues)
  const hasNoEligibleParticipants: boolean =
    result.awarded.length === 0 &&
    result.missingRole.length === 0 &&
    result.invalidSpreadsheetData.length === 0 &&
    result.notInSpreadsheet.length === 0;

  if (hasNoEligibleParticipants) {
    blocks.push(
      createContentBlock(
        [TEMPLE_MESSAGES.NO_ELIGIBLE_PARTICIPANTS],
        TEMPLE_MESSAGES.NO_ELIGIBLE_PARTICIPANTS_HEADER,
      ),
    );
  }

  // Create a combined list of all issues with their placement for sorting
  interface IssueWithPlacement {
    placement: number;
    text: string;
  }

  const allIssues: IssueWithPlacement[] = [];

  // Add members missing role
  for (const member of result.missingRole) {
    const memberMention: string = member.discordID
      ? `${userMention(member.discordID)}`
      : "Unknown member";

    const placementsLine: string = TEMPLE_MESSAGES.placementLine(
      member.placements,
    );
    const gainLine: string = TEMPLE_MESSAGES.gainLine(
      member.totalGain,
      member.cappedPoints,
      member.calculatedPoints,
      member.capReason,
      unit,
      TEMPLE_MESSAGES.WOULD_HAVE_RECEIVED,
    );

    // Error reason
    const errorLine: string = TEMPLE_MESSAGES.missingRole(
      getRoleIDs(guildID).MEMBER_PERMS,
    );

    const issueText: string = [
      memberMention,
      placementsLine,
      gainLine,
      errorLine,
    ]
      .filter(Boolean)
      .join("\n");

    allIssues.push({
      placement: member.bestPlacement,
      text: issueText,
    });
  }

  // Add members with invalid spreadsheet data
  for (const member of result.invalidSpreadsheetData) {
    const placementsLine: string = TEMPLE_MESSAGES.placementLine(
      member.placements,
    );

    const gainLine: string = TEMPLE_MESSAGES.gainLine(
      member.totalGain,
      member.cappedPoints,
      member.calculatedPoints,
      member.capReason,
      unit,
      TEMPLE_MESSAGES.WOULD_HAVE_RECEIVED,
    );

    // Generate error message based on validation errors
    let errorLines: string[] = [];

    if (member.validationErrors && member.validationErrors.length > 0) {
      errorLines = member.validationErrors.map(
        (error: SpreadsheetValidationError): string =>
          TEMPLE_MESSAGES.issue(error.message),
      );
    } else {
      errorLines = [TEMPLE_MESSAGES.INVALID_SPREADSHEET_DATA];
    }

    const issueText: string = [
      inlineCode(member.rsnName),
      placementsLine,
      gainLine,
      ...errorLines,
    ]
      .filter(Boolean)
      .join("\n");

    allIssues.push({
      placement: member.bestPlacement,
      text: issueText,
    });
  }

  // Add participants not found in the spreadsheet
  for (const participant of result.notInSpreadsheet) {
    const placementsLine: string = TEMPLE_MESSAGES.placementLine([participant]);

    const gainLine: string = TEMPLE_MESSAGES.gainLine(
      participant.totalGain,
      participant.cappedPoints,
      participant.calculatedPoints,
      participant.capReason,
      unit,
      TEMPLE_MESSAGES.WOULD_HAVE_RECEIVED,
    );

    const issueText: string = TEMPLE_MESSAGES.notFoundInSpreadsheet(
      participant.username,
      placementsLine,
      gainLine,
    );

    allIssues.push({
      placement: participant.placement,
      text: issueText,
    });
  }

  // Sort all issues by placement
  allIssues.sort(
    (a: IssueWithPlacement, b: IssueWithPlacement): number =>
      a.placement - b.placement,
  );

  const issueLines: string[] = allIssues.map(
    (issue: IssueWithPlacement): string => issue.text,
  );

  // Add issues block if there are any issues
  if (issueLines.length > 0) {
    const totalIssues: number =
      result.missingRole.length +
      result.invalidSpreadsheetData.length +
      result.notInSpreadsheet.length;

    const issuesHeader: string = TEMPLE_MESSAGES.issuesHeader(totalIssues);
    const contentWithSpacing: string[] = [];

    for (let i = 0; i < issueLines.length; i++) {
      let issueText: string = issueLines[i];

      // Add blank line after each issue except the last one
      if (i < issueLines.length - 1) {
        issueText += "\n";
      }

      contentWithSpacing.push(issueText);
    }

    blocks.push(createContentBlock(contentWithSpacing, issuesHeader));
  }

  if (transactionID) {
    blocks.push(createFooterBlock(transactionID));
  }

  return buildContainers(ContainerStyle.SUCCESS, blocks);
}
