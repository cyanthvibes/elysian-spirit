import { SpreadsheetRow } from "src/features/spreadsheet/types.js";
import { TEMPLE_MESSAGES } from "src/features/temple/messages.js";
import { TempleAPIResponse } from "src/features/temple/types.js";
import { EphemeralError } from "utils/errorUtils.js";
import { normaliseName, parseAlts } from "utils/parseUtils.js";

// Function that builds a map of RSN/ALTs and Discord IDs
export function buildDiscordNameMapping(
  rows: SpreadsheetRow[],
): Map<string, string> {
  const discordNameMap = new Map<string, string>();

  // For every row
  for (const row of rows) {
    // If there is no Discord ID in that row, just continue
    if (!row.discordID) continue;

    // Otherwise, add the RSN to the map
    if (row.rsn) {
      const normalisedRSN: string = normaliseName(row.rsn);
      discordNameMap.set(normalisedRSN, row.discordID);
    }

    // If there are ALTs in the row
    if (row.alts) {
      // Parse ALTs from that row
      const altNames: string[] = parseAlts(row.alts);

      // Add every ALT to the map
      for (const altName of altNames) {
        discordNameMap.set(altName, row.discordID);
      }
    }
  }

  return discordNameMap;
}

// Function that fetches data from TempleOSRS using competition ID
export async function fetchTempleData(
  competitionID: number,
): Promise<TempleAPIResponse> {
  const response: Response = await fetch(
    `https://templeosrs.com/api/competition_info_v2.php?id=${competitionID}`,
  );

  if (!response.ok) {
    throw new EphemeralError(TEMPLE_MESSAGES.FETCH_FAILED);
  }

  return (await response.json()) as TempleAPIResponse;
}
