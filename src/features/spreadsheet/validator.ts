import { GuildMember, userMention } from "discord.js";
import {
  DiscordMemberInfo,
  SpreadsheetRow,
  SpreadsheetValidationError,
  SpreadsheetValidationResult,
  ValidatedRow,
  ValidationErrorType,
} from "src/features/spreadsheet/types.js";
import {
  getAllNormalisedNames,
  isEmptyRow,
} from "src/features/spreadsheet/utils.js";
import { SPREADSHEET_MESSAGES } from "src/features/spreadsheet/validate/messages.js";
import {
  normaliseName,
  parseAlts,
  parseDiscordName,
} from "utils/parseUtils.js";

// Function that builds information of Discord members into an object
export function buildDiscordMemberInfo(
  guildMembers: GuildMember[],
): DiscordMemberInfo[] {
  return guildMembers.map(
    (member: GuildMember): DiscordMemberInfo => ({
      displayName: member.displayName,
      id: member.user.id,
      parsedNames: parseDiscordName(member.displayName),
    }),
  );
}

// Function that builds name to Discord ID mappings, detecting ambiguous names
export function buildNameMappings(discordMembers: DiscordMemberInfo[]): {
  ambiguousNames: Set<string>;
  nameToDiscordMapping: Map<string, string>;
} {
  const namesInDisplayNamesMap = new Map<string, string[]>();

  // For each Discord member
  discordMembers.forEach((member: DiscordMemberInfo): void => {
    // Get all normalised names from the display name (these are already normalised by parseDiscordName())
    const allNames: string[] = [
      member.parsedNames.rsn,
      ...member.parsedNames.alts,
    ].filter(Boolean);

    // For every name in the display name
    allNames.forEach((normalisedName: string): void => {
      // Initialise an array for this name if it wasn't seen before
      if (!namesInDisplayNamesMap.has(normalisedName)) {
        namesInDisplayNamesMap.set(normalisedName, []);
      }

      // Get the list of members who also have this name in their display name
      const membersWithThisName: string[] =
        namesInDisplayNamesMap.get(normalisedName) ?? [];

      // Add the Discord member to the list if the member has the same name multiple times
      if (!membersWithThisName.includes(member.id)) {
        membersWithThisName.push(member.id);
      }
    });
  });

  // 1:1 mapping
  const nameToDiscordMapping = new Map<string, string>();
  // Names with conflicts
  const ambiguousNames = new Set<string>();

  // For every name
  namesInDisplayNamesMap.forEach(
    (membersWithThisName: string[], normalisedName: string): void => {
      // If only one Discord member has this name in their display name
      if (membersWithThisName.length === 1) {
        // Create 1:1 mapping
        nameToDiscordMapping.set(normalisedName, membersWithThisName[0]);

        // If multiple members have this name in their display name, mark as ambiguous
      } else {
        ambiguousNames.add(normalisedName);
      }
    },
  );

  return { ambiguousNames, nameToDiscordMapping };
}

// Function that validates the spreadsheet
export function validateSpreadsheet(
  rows: SpreadsheetRow[],
  guildMembers: GuildMember[],
): SpreadsheetValidationResult {
  const discordMembers: DiscordMemberInfo[] =
    buildDiscordMemberInfo(guildMembers);
  const { ambiguousNames, nameToDiscordMapping } =
    buildNameMappings(discordMembers);

  // Filter out completely empty rows
  const nonEmptyRows: SpreadsheetRow[] = rows.filter(
    (row: SpreadsheetRow): boolean => !isEmptyRow(row),
  );

  const rsnUsage: Map<string, number[]> = buildNameUsageMap(
    nonEmptyRows,
    "rsn",
  );
  const altUsage: Map<string, number[]> = buildNameUsageMap(
    nonEmptyRows,
    "alts",
  );
  const discordIDUsage: Map<string, number[]> =
    buildDiscordIDUsageMap(nonEmptyRows);

  // Validate each row
  const validatedRows: ValidatedRow[] = nonEmptyRows.map(
    (row: SpreadsheetRow): ValidatedRow =>
      validateRow(
        row,
        rsnUsage,
        altUsage,
        discordIDUsage,
        nameToDiscordMapping,
        ambiguousNames,
        discordMembers,
      ),
  );

  // Identify rows that can be populated
  const populatableRows: ValidatedRow[] = validatedRows.filter(
    (validRow: ValidatedRow): boolean => validRow.canPopulate,
  );

  // Group errors by row number
  const errorsByRow = new Map<number, SpreadsheetValidationError[]>();

  validatedRows.forEach((validRow: ValidatedRow): void => {
    if (validRow.errors.length > 0) {
      errorsByRow.set(validRow.row.row, validRow.errors);
    }
  });

  return {
    errorsByRow,
    populatableRows,
    validatedRows,
  };
}

// Function that builds map of Discord IDs to row numbers
function buildDiscordIDUsageMap(rows: SpreadsheetRow[]): Map<string, number[]> {
  const usage = new Map<string, number[]>();

  rows.forEach((row: SpreadsheetRow): void => {
    if (row.discordID.trim()) {
      const discordID: string = row.discordID.trim();
      const existingRows: number[] = usage.get(discordID) || [];

      existingRows.push(row.row);
      usage.set(discordID, existingRows);
    }
  });

  return usage;
}

// Function that builds map of normalised names to row numbers for RSNs and ALTs
function buildNameUsageMap(
  rows: SpreadsheetRow[],
  type: "alts" | "rsn",
): Map<string, number[]> {
  const usage = new Map<string, number[]>();

  // For every row
  rows.forEach((row: SpreadsheetRow): void => {
    // In the case of RSN
    if (type === "rsn" && row.rsn.trim()) {
      // Normalise RSN from row
      const normalisedRSN: string = normaliseName(row.rsn);

      if (normalisedRSN) {
        const existingRows: number[] = usage.get(normalisedRSN) || [];

        existingRows.push(row.row);
        usage.set(normalisedRSN, existingRows);
      }

      // In the case of ALTs
    } else if (type === "alts") {
      // Parse ALTs from row (parseAlts() already normalises names)
      const normalisedALTs: string[] = parseAlts(row.alts);

      normalisedALTs.forEach((normalisedALT: string): void => {
        const existingRows: number[] = usage.get(normalisedALT) || [];

        existingRows.push(row.row);
        usage.set(normalisedALT, existingRows);
      });
    }
  });

  return usage;
}

// Function that checks for Discord ID uniqueness across the spreadsheet
function validateDiscordIDUniqueness(
  row: SpreadsheetRow,
  discordIDUsage: Map<string, number[]>,
): SpreadsheetValidationError[] {
  const errors: SpreadsheetValidationError[] = [];

  if (row.discordID.trim()) {
    const discordIDRows: number[] =
      discordIDUsage.get(row.discordID.trim()) || [];

    if (discordIDRows.length > 1) {
      errors.push({
        message: SPREADSHEET_MESSAGES.discordIDDuplicate(row.discordID),
        type: ValidationErrorType.DISCORD_ID_DUPLICATE,
      });
    }
  }

  return errors;
}

// Function that checks if each RSN and ALT match exactly one member
// If multiple Discord members have the same name, mark as ambiguous
// The RSN and ALTs in a row should match the same Discord member
function validateDiscordMatching(
  row: SpreadsheetRow,
  nameToDiscordMapping: Map<string, string>,
  ambiguousNames: Set<string>,
  discordMembers: DiscordMemberInfo[],
): { discordIDToBePopulated?: string; errors: SpreadsheetValidationError[] } {
  const errors: SpreadsheetValidationError[] = [];

  const allNormalisedNames: string[] = getAllNormalisedNames(row);

  let discordIDToBePopulated: string | undefined = undefined;

  // Check for ambiguous names
  const ambiguousMatches: string[] = allNormalisedNames.filter(
    (name: string): boolean => ambiguousNames.has(name),
  );

  // If there are ambiguous matches
  if (ambiguousMatches.length > 0) {
    // Find which Discord members have these ambiguous names
    const ambiguousDiscordIDs = new Set<string>();

    // For every ambiguous match
    ambiguousMatches.forEach((name: string): void => {
      // For every Discord member
      discordMembers.forEach((member: DiscordMemberInfo): void => {
        const memberNames: string[] = [
          member.parsedNames.rsn,
          ...member.parsedNames.alts,
        ].filter(Boolean);

        // If the ambiguous name is found in a name of a Discord member
        if (memberNames.includes(name)) {
          // Add that Discord member's ID to the set
          ambiguousDiscordIDs.add(member.id);
        }
      });
    });

    const memberMentions: string = Array.from(ambiguousDiscordIDs)
      .map((id: string): string => `${userMention(id)}`)
      .join(", ");

    errors.push({
      message: SPREADSHEET_MESSAGES.ambiguousDiscordMatch(
        row,
        ambiguousMatches,
        memberMentions,
      ),
      type: ValidationErrorType.AMBIGUOUS_DISCORD_MATCH,
    });

    // If there are no ambiguous matches
  } else {
    const matchingDiscordIDs = new Set<string>();

    // Find unique Discord matches for all names in this row
    allNormalisedNames.forEach((name: string): void => {
      const discordID: string | undefined = nameToDiscordMapping.get(name);

      // If a match was found
      if (discordID) {
        // Add the Discord ID to the set
        matchingDiscordIDs.add(discordID);
      }
    });

    // If no Discord matches any name in this row
    if (matchingDiscordIDs.size === 0) {
      errors.push({
        message: SPREADSHEET_MESSAGES.noDiscordMatch(row, allNormalisedNames),
        type: ValidationErrorType.NO_DISCORD_MATCH,
      });

      // If multiple Discord members match different names in this row
    } else if (matchingDiscordIDs.size > 1) {
      const memberMentions: string = Array.from(matchingDiscordIDs)
        .map((id: string): string => `${userMention(id)}`)
        .join(", ");

      errors.push({
        message: SPREADSHEET_MESSAGES.ambiguousDiscordMatch(
          row,
          ambiguousMatches,
          memberMentions,
        ),
        type: ValidationErrorType.AMBIGUOUS_DISCORD_MATCH,
      });

      // If exactly one Discord member matches all names in this row
    } else {
      discordIDToBePopulated = Array.from(matchingDiscordIDs)[0];
    }
  }

  return { discordIDToBePopulated, errors };
}

// Function that checks if an already filled in Discord ID matches the Discord ID to be populated
function validateExistingDiscordID(
  row: SpreadsheetRow,
  discordIDToBePopulated: string,
): SpreadsheetValidationError[] {
  const errors: SpreadsheetValidationError[] = [];

  // If the row has a Discord ID, but it's different from the Discord ID that would be filled in
  if (row.discordID.trim() && row.discordID.trim() !== discordIDToBePopulated) {
    errors.push({
      message: SPREADSHEET_MESSAGES.incorrectDiscordID(
        row.discordID,
        discordIDToBePopulated,
      ),
      type: ValidationErrorType.INCORRECT_DISCORD_ID,
    });
  }

  return errors;
}

// Function that checks for RSN and ALT uniqueness across the spreadsheet
function validateNameUniqueness(
  row: SpreadsheetRow,
  rsnUsage: Map<string, number[]>,
  altUsage: Map<string, number[]>,
): SpreadsheetValidationError[] {
  const errors: SpreadsheetValidationError[] = [];
  const normalisedRSN: string = normaliseName(row.rsn);
  const normalisedALTs: string[] = parseAlts(row.alts);

  const originalALTs: string[] = row.alts
    .split(",")
    .map((alt: string): string => alt.trim())
    .filter(Boolean);

  // Check for RSN duplicates
  if (normalisedRSN) {
    const rsnRows: number[] = rsnUsage.get(normalisedRSN) || [];

    // If the RSN is found in more than one row
    if (rsnRows.length > 1) {
      errors.push({
        message: SPREADSHEET_MESSAGES.rsnDuplicate(row, rsnRows),
        type: ValidationErrorType.RSN_DUPLICATE,
      });
    }

    const altRows: number[] = altUsage.get(normalisedRSN) || [];

    // If the RSN is used as an ALT elsewhere
    if (altRows.length > 0) {
      errors.push({
        message: SPREADSHEET_MESSAGES.rsnUsedAsALT(row, altRows),
        type: ValidationErrorType.RSN_USED_AS_ALT,
      });
    }
  }

  // Check each ALT for duplicates and cross-usage
  normalisedALTs.forEach((normalisedALT: string, index: number): void => {
    const originalALT: string = originalALTs[index];

    // Check ALT duplicates across spreadsheet
    const altRows: number[] = altUsage.get(normalisedALT) || [];

    // If the ALT is used as an ALT elsewhere
    if (altRows.length > 1) {
      errors.push({
        altIndex: index,
        message: SPREADSHEET_MESSAGES.altDuplicate(originalALT, altRows),
        type: ValidationErrorType.ALT_DUPLICATE,
      });
    }

    const rsnRows: number[] = rsnUsage.get(normalisedALT) || [];

    // If the ALT is used as an RSN elsewhere
    if (rsnRows.length > 0) {
      errors.push({
        message: SPREADSHEET_MESSAGES.altUsedAsRSN(originalALT, rsnRows),
        type: ValidationErrorType.ALT_USED_AS_RSN,
      });
    }
  });

  return errors;
}

// Function that validates a single row
function validateRow(
  row: SpreadsheetRow,
  rsnUsage: Map<string, number[]>,
  altUsage: Map<string, number[]>,
  discordIDUsage: Map<string, number[]>,
  nameToDiscordMapping: Map<string, string>,
  ambiguousNames: Set<string>,
  discordMembers: DiscordMemberInfo[],
): ValidatedRow {
  let errors: SpreadsheetValidationError[] = [];

  // Put all errors together for a row
  errors = errors.concat(validateRSN(row));
  errors = errors.concat(validateNameUniqueness(row, rsnUsage, altUsage));
  errors = errors.concat(validateDiscordIDUniqueness(row, discordIDUsage));

  // Try to match any names in the row to a Discord member and get errors and optionally the Discord ID to be populated
  const discordMatchResult: {
    discordIDToBePopulated?: string;
    errors: SpreadsheetValidationError[];
  } = validateDiscordMatching(
    row,
    nameToDiscordMapping,
    ambiguousNames,
    discordMembers,
  );

  // Put the errors returned by validateDiscordMatching() together with the other errors for this row
  errors = errors.concat(discordMatchResult.errors);

  const discordIDToBePopulated: string | undefined =
    discordMatchResult.discordIDToBePopulated;

  // If a Discord ID was returned by the matching function
  if (discordIDToBePopulated) {
    // Validate that the expected Discord ID is the same as the one already in the spreadsheet
    // If the expected Discord ID
    // If no Discord in the spreadsheet, no errors get added
    errors = errors.concat(
      validateExistingDiscordID(row, discordIDToBePopulated),
    );
  }

  // Determine if a row is valid and if it can be populated
  const isValid: boolean = errors.length === 0;
  const canPopulate: boolean =
    isValid && !row.discordID.trim() && !!discordIDToBePopulated;

  return {
    canPopulate,
    errors,
    expectedDiscordID: discordIDToBePopulated,
    isValid,
    row,
  };
}

// Function that checks if RSN is not empty and doesn't contain multiple RSNs
function validateRSN(row: SpreadsheetRow): SpreadsheetValidationError[] {
  const errors: SpreadsheetValidationError[] = [];

  // RSN is empty
  if (!row.rsn.trim()) {
    errors.push({
      message: SPREADSHEET_MESSAGES.MISSING_RSN,
      type: ValidationErrorType.MISSING_RSN,
    });
  }

  // RSN has multiple RSNs
  if (row.rsn.includes(",")) {
    errors.push({
      message: SPREADSHEET_MESSAGES.MULTIPLE_RSNS,
      type: ValidationErrorType.MULTIPLE_RSNS,
    });
  }

  return errors;
}
