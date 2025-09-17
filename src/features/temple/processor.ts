import { ROLE_KEYS } from "constants/roles.js";
import { Guild, GuildMember } from "discord.js";
import {
  SpreadsheetRow,
  SpreadsheetValidationError,
  SpreadsheetValidationResult,
  ValidatedRow,
} from "src/features/spreadsheet/types.js";
import { getAllNormalisedNames } from "src/features/spreadsheet/utils.js";
import { validateSpreadsheet } from "src/features/spreadsheet/validator.js";
import { TEMPLE_MESSAGES } from "src/features/temple/messages.js";
import {
  ClanPointsConfig,
  ProcessedTempleParticipant,
  TempleAwardedMember,
  TempleCompetitionData,
  TempleInvalidMember,
  TempleNotInSpreadsheetMember,
  TempleResult,
} from "src/features/temple/types.js";
import { buildDiscordNameMapping } from "src/features/temple/utils.js";
import { normaliseName } from "utils/parseUtils.js";
import {
  filterMembersWithRole,
  FilterMembersWithRoleResult,
} from "utils/roleUtils.js";

enum CATEGORIES {
  AWARDED = "awarded",
  INVALID_DATA = "invalidData",
  MISSING_ROLE = "missingRole",
  NOT_FOUND = "notFound",
}

// Helper function to calculate clan points from placements
export function calculatePoints(
  placements: ProcessedTempleParticipant[],
  config: ClanPointsConfig,
): {
  bestPlacement: number;
  calculatedPoints: number;
  cappedPoints: number;
  capReason: string;
  totalGain: number;
} {
  // Sum gains for all placements
  const totalGain: number = placements.reduce(
    (sum: number, placement: ProcessedTempleParticipant): number =>
      sum + placement.gain,
    0,
  );

  // Determine the best placement
  const bestPlacement: number = Math.min(
    ...placements.map(
      (placement: ProcessedTempleParticipant): number => placement.placement,
    ),
  );

  // Calculate clan points from total gain
  const rawPoints: number = totalGain / config.gainPerClanPoint;

  // First round down, then add another point if the user is close (90%) to earning another clan point
  const calculatedPoints: number =
    Math.floor(rawPoints) + (rawPoints % 1 >= 0.9 ? 1 : 0);

  let cappedPoints: number = calculatedPoints;
  let capReason = "";

  // First place
  if (bestPlacement === 1 && config.firstPlaceCap > 0) {
    cappedPoints = Math.min(cappedPoints, config.firstPlaceCap);

    if (calculatedPoints > config.firstPlaceCap) {
      capReason = TEMPLE_MESSAGES.firstPlaceCap(config.firstPlaceCap);
    }

    // Second place
  } else if (bestPlacement === 2 && config.secondPlaceCap > 0) {
    cappedPoints = Math.min(cappedPoints, config.secondPlaceCap);

    if (calculatedPoints > config.secondPlaceCap) {
      capReason = TEMPLE_MESSAGES.secondPlaceCap(config.secondPlaceCap);
    }

    // Third place
  } else if (bestPlacement === 3 && config.thirdPlaceCap > 0) {
    cappedPoints = Math.min(cappedPoints, config.thirdPlaceCap);

    if (calculatedPoints > config.thirdPlaceCap) {
      capReason = TEMPLE_MESSAGES.thirdPlaceCap(config.thirdPlaceCap);
    }

    // Apply general maximum per person cap only if no placement-specific cap applies
  } else {
    if (config.maxPerPerson > 0) {
      cappedPoints = Math.min(cappedPoints, config.maxPerPerson);

      if (calculatedPoints > config.maxPerPerson) {
        capReason = TEMPLE_MESSAGES.generalCap(config.maxPerPerson);
      }
    }
  }

  return {
    bestPlacement,
    calculatedPoints,
    cappedPoints,
    capReason,
    totalGain,
  };
}

export async function processTempleCompetition(
  rows: SpreadsheetRow[],
  templeData: TempleCompetitionData,
  config: ClanPointsConfig,
  members: GuildMember[],
  guild: Guild,
): Promise<TempleResult> {
  // Validate spreadsheet
  const validationResult: SpreadsheetValidationResult = validateSpreadsheet(
    rows,
    members,
  );

  // Get valid rows only
  const validRows: ValidatedRow[] = validationResult.validatedRows.filter(
    (validRow: ValidatedRow): boolean => validRow.isValid,
  );

  // Build a map of RSN/ALTs and Discord IDs from valid rows only
  const validRowsOnly: SpreadsheetRow[] = validRows.map(
    (validRow: ValidatedRow): SpreadsheetRow => validRow.row,
  );

  // Creat a map of RSN/ALTs and Discord IDs
  const discordNameMap: Map<string, string> =
    buildDiscordNameMapping(validRowsOnly);

  const toBeAwardedDiscordUser: TempleAwardedMember[] = [];
  const discordMembersMissingRole: TempleInvalidMember[] = [];
  const participantsWithInvalidSpreadsheetData: TempleInvalidMember[] = [];
  const participantsNotFoundInSpreadsheet: TempleNotInSpreadsheetMember[] = [];

  // Make a new map that will hold categorised participants with an associated Discord ID and row number in the spreadsheet
  const categorisedParticipants = new Map<
    string,
    {
      category: CATEGORIES;
      discordID?: string;
      participant: ProcessedTempleParticipant;
      rowNumber?: number;
    }
  >();

  // For each participant in the TempleOSRS data
  for (const participant of templeData.participants) {
    // Categorise each participant
    const categorisation: {
      category: CATEGORIES;
      participantRow?: SpreadsheetRow;
      rowNumber?: number;
    } = categoriseParticipant(participant, rows, validationResult);

    // Not in spreadsheet at all
    if (categorisation.category === CATEGORIES.NOT_FOUND) {
      // If the participant had any gains
      if (participant.gain > 0) {
        // Add the participant to the map
        categorisedParticipants.set(participant.username, {
          category: CATEGORIES.NOT_FOUND,
          participant,
        });
      }

      continue;
    }

    // Participant in spreadsheet but row has validation errors
    if (categorisation.category === CATEGORIES.INVALID_DATA) {
      // Add participant to the map
      categorisedParticipants.set(participant.username, {
        category: CATEGORIES.INVALID_DATA,
        participant,
        rowNumber: categorisation.rowNumber,
      });

      continue;
    }

    // Participant has valid spreadsheet data, get the Discord ID
    const discordID: string | undefined = discordNameMap.get(
      normaliseName(
        participant.player_name_with_capitalization || participant.username,
      ),
    );

    // This shouldn't happen if validation passed, but handle gracefully
    if (!discordID) {
      continue;
    }

    // Add the participant to the map with their Discord ID
    categorisedParticipants.set(participant.username, {
      category: CATEGORIES.AWARDED,
      discordID,
      participant,
      rowNumber: categorisation.rowNumber,
    });
  }

  // Try to get the Discord IDs for all participants
  const allDiscordIDs: string[] = Array.from(
    new Set(
      Array.from(categorisedParticipants.values())
        .map(
          (result: {
            category: CATEGORIES;
            discordID?: string;
            participant: ProcessedTempleParticipant;
            rowNumber?: number;
          }): string | undefined => result.discordID,
        )
        .filter(Boolean) as string[],
    ),
  );

  // For all participants, check for required roles
  const roleCheck: FilterMembersWithRoleResult = await filterMembersWithRole(
    guild,
    allDiscordIDs,
    ROLE_KEYS.MEMBER_PERMS,
  );

  // Update categories in the map based on role check
  for (const result of categorisedParticipants.values()) {
    if (result.discordID && !roleCheck.allowed.includes(result.discordID)) {
      result.category = CATEGORIES.MISSING_ROLE;
    }
  }

  // Group by Discord ID and category
  const toBeAwardedParticipantsMatchedToDiscordMemberGroupedByDiscordID =
    new Map<string, ProcessedTempleParticipant[]>();
  const participantsMatchedToDiscordMemberMissingRoleGroupedByDiscordID =
    new Map<string, ProcessedTempleParticipant[]>();

  // For every categorised participant
  for (const result of categorisedParticipants.values()) {
    // If the participant is awarded
    if (result.category === CATEGORIES.AWARDED && result.discordID) {
      // Add them to the array that holds participants who will be awarded points
      toBeAwardedParticipantsMatchedToDiscordMemberGroupedByDiscordID.set(
        result.discordID,
        [
          ...(toBeAwardedParticipantsMatchedToDiscordMemberGroupedByDiscordID.get(
            result.discordID,
          ) ?? []),
          result.participant,
        ],
      );

      // If the participant is missing the required role
    } else if (
      result.category === CATEGORIES.MISSING_ROLE &&
      result.discordID
    ) {
      // Add them to the array that holds participants, who match to one Discord ID, but lack the required role
      participantsMatchedToDiscordMemberMissingRoleGroupedByDiscordID.set(
        result.discordID,
        [
          ...(participantsMatchedToDiscordMemberMissingRoleGroupedByDiscordID.get(
            result.discordID,
          ) ?? []),
          result.participant,
        ],
      );

      // If the participant has invalid data
    } else if (result.category === CATEGORIES.INVALID_DATA) {
      // Calculate points this participant would've been awarded
      const points: {
        bestPlacement: number;
        calculatedPoints: number;
        cappedPoints: number;
        capReason: string;
        totalGain: number;
      } = calculatePoints([result.participant], config);

      // If they would've been awarded
      if (points.cappedPoints > 0) {
        const rowErrors: SpreadsheetValidationError[] = result.rowNumber
          ? validationResult.errorsByRow.get(result.rowNumber) || []
          : [];

        // Add this participant to the array that holds participants with invalid data
        participantsWithInvalidSpreadsheetData.push({
          placements: [result.participant],
          rsnName: result.participant.username,
          ...points,
          validationErrors: rowErrors,
        });
      }

      // If the participant wasn't found in the spreadsheet
    } else if (result.category === CATEGORIES.NOT_FOUND) {
      // Calculate points this participant would've been awarded
      const points: {
        bestPlacement: number;
        calculatedPoints: number;
        cappedPoints: number;
        capReason: string;
        totalGain: number;
      } = calculatePoints([result.participant], config);

      if (points.calculatedPoints > 0) {
        // Add this participant to the array that holds participants not found in the spreadsheet
        participantsNotFoundInSpreadsheet.push({
          bestPlacement: points.bestPlacement,
          calculatedPoints: points.calculatedPoints,
          cappedPoints: points.cappedPoints,
          capReason: points.capReason,
          gain: result.participant.gain,
          placement: result.participant.placement,
          totalGain: points.totalGain,
          username: result.participant.username,
        });
      }
    }
  }

  // Process one or more participants grouped by one Discord ID
  for (const [
    discordID,
    placements,
  ] of toBeAwardedParticipantsMatchedToDiscordMemberGroupedByDiscordID.entries()) {
    // Calculate points for the Discord member based on all their placements
    const user: null | TempleAwardedMember = createUserWithPoints(
      discordID,
      placements,
      config,
    );

    // Only add the Discord member to the toBeAwardedDiscordUser array if they are getting points
    if (user) {
      toBeAwardedDiscordUser.push(user);
    }
  }

  // Process missing role members
  for (const [
    discordID,
    placements,
  ] of participantsMatchedToDiscordMemberMissingRoleGroupedByDiscordID.entries()) {
    // Calculate points for the Discord member based on all their placements
    const user: null | TempleAwardedMember = createUserWithPoints(
      discordID,
      placements,
      config,
    );

    // Only add the Discord user to the missing role array if they are getting points
    if (user) {
      const discordUserMissingRole: TempleAwardedMember = user;

      discordMembersMissingRole.push({
        bestPlacement: discordUserMissingRole.bestPlacement,
        calculatedPoints: discordUserMissingRole.calculatedPoints,
        cappedPoints: discordUserMissingRole.cappedPoints,
        capReason: discordUserMissingRole.capReason,
        discordID: discordUserMissingRole.discordID,
        placements: discordUserMissingRole.placements,
        rsnName: placements
          .map((p: ProcessedTempleParticipant): string => p.username)
          .join(", "),
        totalGain: discordUserMissingRole.totalGain,
      });
    }
  }

  // Sort all arrays by the best placement
  toBeAwardedDiscordUser.sort(
    (a: TempleAwardedMember, b: TempleAwardedMember): number =>
      a.bestPlacement - b.bestPlacement,
  );
  discordMembersMissingRole.sort(
    (a: TempleInvalidMember, b: TempleInvalidMember): number =>
      a.bestPlacement - b.bestPlacement,
  );
  participantsWithInvalidSpreadsheetData.sort(
    (a: TempleInvalidMember, b: TempleInvalidMember): number =>
      a.bestPlacement - b.bestPlacement,
  );
  participantsNotFoundInSpreadsheet.sort(
    (
      a: TempleNotInSpreadsheetMember,
      b: TempleNotInSpreadsheetMember,
    ): number => a.placement - b.placement,
  );

  // Filter validation errors to only affected participants
  const participantNames = new Set(
    templeData.participants.map(
      (participant: ProcessedTempleParticipant): string => {
        const searchName: string =
          participant.player_name_with_capitalization || participant.username;

        return normaliseName(searchName);
      },
    ),
  );

  // Create a map of participants affected by errors in the spreadsheet
  const participantsAffectedErrorsByRow = new Map<
    number,
    SpreadsheetValidationError[]
  >();

  // For every error in the spreadsheet
  for (const [rowNumber, errors] of validationResult.errorsByRow.entries()) {
    // Get the row from the spreadsheet where the error occurred
    const row: SpreadsheetRow | undefined = rows.find(
      (row: SpreadsheetRow): boolean => row.row === rowNumber,
    );

    // This shouldn't be the case, but if no row was found, just continue
    if (!row) continue;

    // Get all names from that row
    const rowNames: string[] = getAllNormalisedNames(row);

    // Get the participants affected by the error
    const affectedParticipants: boolean = rowNames.some(
      (name: string): boolean => participantNames.has(name),
    );

    // If there are affected participants, add them to the map
    if (affectedParticipants) {
      participantsAffectedErrorsByRow.set(rowNumber, errors);
    }
  }

  // Build summary
  const summary = {
    affectedErrorsByRow: participantsAffectedErrorsByRow,
    awardedCount: toBeAwardedDiscordUser.length,
    invalidDataCount: participantsWithInvalidSpreadsheetData.length,
    missingRoleCount: discordMembersMissingRole.length,
    notInSpreadsheetCount: participantsNotFoundInSpreadsheet.length,
    totalParticipants: templeData.participants.length,
    totalPointsAwarded: toBeAwardedDiscordUser.reduce(
      (sum: number, award: TempleAwardedMember): number =>
        sum + award.cappedPoints,
      0,
    ),
  };

  return {
    awarded: toBeAwardedDiscordUser,
    invalidSpreadsheetData: participantsWithInvalidSpreadsheetData,
    missingRole: discordMembersMissingRole,
    notInSpreadsheet: participantsNotFoundInSpreadsheet,
    summary,
  };
}

// Helper function to categorise a participant
function categoriseParticipant(
  participant: ProcessedTempleParticipant,
  rows: SpreadsheetRow[],
  validationResult: SpreadsheetValidationResult,
): {
  category: CATEGORIES;
  participantRow?: SpreadsheetRow;
  rowNumber?: number;
} {
  // Use capitalised name if available, otherwise fallback to username
  const searchName: string =
    participant.player_name_with_capitalization || participant.username;
  const normalisedSearchName: string = normaliseName(searchName);

  // Check if participant is in the spreadsheet at all
  const participantRow: SpreadsheetRow | undefined = rows.find(
    (row: SpreadsheetRow): boolean => {
      const rowNames: string[] = getAllNormalisedNames(row);
      return rowNames.includes(normalisedSearchName);
    },
  );

  // Not in spreadsheet at all
  if (!participantRow) {
    return { category: CATEGORIES.NOT_FOUND };
  }

  // Find validation info for this row
  const validatedRow: undefined | ValidatedRow =
    validationResult.validatedRows.find(
      (validRow: ValidatedRow): boolean =>
        validRow.row.row === participantRow.row,
    );

  // Participant in spreadsheet but row has validation errors
  if (!validatedRow?.isValid) {
    return {
      category: CATEGORIES.INVALID_DATA,
      participantRow,
      rowNumber: participantRow.row,
    };
  }

  // Participant has valid spreadsheet data
  return {
    category: CATEGORIES.AWARDED,
    participantRow,
    rowNumber: participantRow.row,
  };
}

// Helper function to calculate points for a Discord user based on all their placements
function createUserWithPoints(
  discordID: string,
  placements: ProcessedTempleParticipant[],
  config: ClanPointsConfig,
): null | TempleAwardedMember {
  // Calculate points for all placements first
  const points: {
    bestPlacement: number;
    calculatedPoints: number;
    cappedPoints: number;
    capReason: string;
    totalGain: number;
  } = calculatePoints(placements, config);

  // Do not return anything if no points would be awarded
  if (points.cappedPoints <= 0) {
    return null;
  }

  // Otherwise, return the data for the Discord user
  return {
    discordID,
    placements,
    ...points,
  };
}
