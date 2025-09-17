import { getRoleID } from "config/configUtils.js";
import { ROLE_KEYS } from "constants/roles.js";
import { updateLastMessageSentAt } from "database/repositories/members/memberRepository.js";
import { Guild, GuildMember, Role } from "discord.js";
import {
  CLEANUP_INTERVAL_MS,
  DEBOUNCE_MS,
  ENTRY_LIFETIME_MS,
} from "src/features/activity/constants.js";

interface DeRankResult {
  alreadyDeRanked: string[];
  deRanked: string[];
}

let cleanupInterval: NodeJS.Timeout | null = null;
const lastUpdatedMap: Map<string, number> = new Map<string, number>();

// De-ranks members by removing their "member perms" role and giving them the "guest" role
export async function deRankMembers(
  guild: Guild,
  memberIDs: string[],
): Promise<DeRankResult> {
  // Get role IDs
  const memberRoleID: string = getRoleID(guild.id, ROLE_KEYS.MEMBER_PERMS);
  const guestRoleID: string = getRoleID(guild.id, ROLE_KEYS.GUEST);

  // Get the roles from the guild by role ID
  const guestRole: Role | undefined = guild.roles.cache.get(guestRoleID);
  const memberRole: Role | undefined = guild.roles.cache.get(memberRoleID);

  // Exit early if the roles aren't found
  if (!guestRole || !memberRole) {
    return { alreadyDeRanked: [], deRanked: [] };
  }

  const deRanked: string[] = [];
  const alreadyDeRanked: string[] = [];

  // For every Discord ID
  for (const memberID of memberIDs) {
    // Get the member object from the guild
    const member: GuildMember | null = await guild.members
      .fetch(memberID)
      .catch((): null => null);

    // Continue if the member somehow wasn't found
    if (!member) continue;

    // Check for roles for that member
    const hasMemberRole: boolean = member.roles.cache.has(memberRoleID);
    const hasGuestRole: boolean = member.roles.cache.has(guestRoleID);

    // If the member has the member perms role but not the guest role
    if (hasMemberRole && !hasGuestRole) {
      // Remove the member perms role
      await member.roles.remove(memberRoleID);
      // Add the guest role
      await member.roles.add(guestRoleID);
      deRanked.push(memberID);

      // If the member doesn't have the guest nor the member perms role
    } else if (!hasMemberRole && !hasGuestRole) {
      // Add the guest role
      await member.roles.add(guestRoleID);
      deRanked.push(memberID);

      // If the member has both roles
    } else if (hasMemberRole && hasGuestRole) {
      // Remove the member perms role
      await member.roles.remove(memberRoleID);
      deRanked.push(memberID);

      // If the member has the guest role
    } else {
      alreadyDeRanked.push(memberID);
    }
  }

  return { alreadyDeRanked, deRanked };
}

// Function that tracks activity for a Discord member
export async function trackActivity(
  guild: Guild,
  discordID: string,
): Promise<void> {
  const now: number = Date.now();
  const lastUpdated: number = lastUpdatedMap.get(discordID) ?? 0;

  // If the member has already sent a message in the last DEBOUNCE_MS time, exit early
  if (now - lastUpdated < DEBOUNCE_MS) return;

  // Start interval and update timestamp for member in the database
  lastUpdatedMap.set(discordID, now);
  startCleanupInterval();
  await updateLastMessageSentAt(guild, discordID);
}

// Function that clears the in-memory map of members and their timestamp
function cleanupMap(): void {
  const now: number = Date.now();

  for (const [discordID, lastUpdated] of lastUpdatedMap.entries()) {
    // Remove entries from the in-memory map if members haven't sent a message for ENTRY_LIFETIME_MS
    if (now - lastUpdated > ENTRY_LIFETIME_MS) {
      lastUpdatedMap.delete(discordID);
    }
  }

  // If the in-memory map is empty, stop the clean-up interval
  if (lastUpdatedMap.size === 0) {
    stopCleanupInterval();
  }
}

// Function to start clean-up interval
function startCleanupInterval(): void {
  // Exit early if the interval is already set
  if (cleanupInterval !== null) return;

  // Set interval to clean up the in-memory map
  cleanupInterval = setInterval(cleanupMap, CLEANUP_INTERVAL_MS);
}

// Function to stop clean-up interval
function stopCleanupInterval(): void {
  // If the clean-up interval is started, stop it
  if (cleanupInterval !== null) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
