import { EMOJIS } from "constants/emojis.js";
import { bold, inlineCode, roleMention } from "discord.js";
import {
  ProcessedTempleParticipant,
  TempleNotInSpreadsheetMember,
} from "src/features/temple/types.js";
import {
  formatNumber,
  getMedalEmoji,
  ordinalSuffix,
  pluralise,
} from "utils/formatUtils.js";

export const TEMPLE_MESSAGES = {
  FETCH_FAILED: `${bold("Failed to fetch data from TempleOSRS.")}`,
  FIRST_REPLY_HEADER: `${EMOJIS.CHECKING} Processing TempleOSRS competition...`,

  firstPlaceCap: (cap: number): string => {
    return `capped at ${bold(String(cap))} for first place`;
  },

  GAIN: "Gain",

  gainLine: (
    totalGain: number,
    cappedPoints: number,
    calculatedPoints: number,
    capReason: string | undefined,
    unit: string,
    prefix: string,
    finalBalance?: number,
  ): string => {
    let gainLine = `${prefix}: ${formatNumber(totalGain)} ${unit} = ${bold(formatNumber(cappedPoints))} ${pluralise(cappedPoints, "clan point")}`;

    // If the balance was actually updated
    if (finalBalance !== undefined) {
      gainLine += ` (New balance: ${bold(formatNumber(finalBalance))})`;
    }

    // If the points were capped
    if (capReason && cappedPoints !== calculatedPoints) {
      gainLine += ` (${capReason})`;
    }

    return gainLine;
  },

  generalCap: (cap: number): string => {
    return `capped at ${bold(String(cap))} maximum per person`;
  },

  INVALID_SPREADSHEET_DATA: `${bold("Issue")}: Invalid spreadsheet data`,

  issue: (issue: string): string => `${bold("Issue:")} ${issue}`,

  issuesHeader: (count: number): string => {
    return `${EMOJIS.ERROR} ${bold(`${pluralise(count, "Issue")} regarding TempleOSRS competition and the spreadsheet:\n`)}`;
  },

  mainHeader: (competitionName: string): string => {
    return `${EMOJIS.TROPHY} ${bold(`TempleOSRS Competition: ${competitionName}`)}`;
  },

  missingRole: (roleID: string): string => {
    return `${bold("Issue")}: Missing ${roleMention(roleID)} role`;
  },

  NO_ELIGIBLE_PARTICIPANTS: "No participants were eligible for clan points.",
  NO_ELIGIBLE_PARTICIPANTS_HEADER: `${bold("No Eligible Participants")}`,

  notFoundInSpreadsheet: (
    name: string,
    placementsLine: string,
    gainLine: string,
  ): string => {
    return `${inlineCode(name)}\n${placementsLine}\n${gainLine}\n${bold("Issue")}: Not found in spreadsheet`;
  },

  placementLine: (
    placements: ProcessedTempleParticipant[] | TempleNotInSpreadsheetMember[],
  ): string => {
    // If there is only 1 placement
    if (placements.length === 1) {
      const placement:
        | ProcessedTempleParticipant
        | TempleNotInSpreadsheetMember = placements[0];
      const medal: string = getMedalEmoji(placement.placement);

      return `${bold("Placement")}: ${medal}${ordinalSuffix(placement.placement)} place`;

      // If there is more than one placement
    } else if (placements.length > 1) {
      return `${bold("Placements")}: ${placements
        .map(
          ({
            placement,
            username,
          }:
            | ProcessedTempleParticipant
            | TempleNotInSpreadsheetMember): string => {
            const medal: string = getMedalEmoji(placement);
            return `${inlineCode(username)} (${medal}${ordinalSuffix(placement)} place)`;
          },
        )
        .join(", ")}`;
    }

    return "";
  },

  resultsHeader: (count: number): string => {
    return `${EMOJIS.SUMMARY} ${bold(`Competition ${pluralise(count, "result")}`)}:\n`;
  },

  secondPlaceCap: (cap: number): string => {
    return `capped at ${bold(String(cap))} for second place`;
  },

  thirdPlaceCap: (cap: number): string => {
    return `capped at ${bold(String(cap))} for third place`;
  },

  unit: (isSkillCompetition: boolean): string => {
    return isSkillCompetition ? "xp" : "kc";
  },

  WOULD_HAVE_RECEIVED: "Would have received",
} as const;
