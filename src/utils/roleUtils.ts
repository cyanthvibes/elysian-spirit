import { getRoleID } from "config/configUtils.js";
import { ROLE_KEY } from "constants/roles.js";
import { Collection, Guild, GuildMember } from "discord.js";

export interface FilterMembersWithRoleResult {
  allowed: string[];
  skipped: string[];
}

// Filters a list of member IDs based on whether they have a specific role in the guild
export async function filterMembersWithRole(
  guild: Guild,
  discordIDs: string[],
  requiredRole: ROLE_KEY,
): Promise<FilterMembersWithRoleResult> {
  if (discordIDs.length === 0) return { allowed: [], skipped: [] };

  const uniqueMemberIDs: string[] = [...new Set(discordIDs)];

  try {
    // Get all members from the guild
    const members: Collection<string, GuildMember> = await guild.members.fetch({
      user: uniqueMemberIDs,
    });

    // Get the role ID for the required role for this guild
    const requiredRoleID: string = getRoleID(guild.id, requiredRole);

    // Create a set of member IDs with the required role
    const membersWithRole = new Set(
      members
        .filter((member: GuildMember): boolean =>
          member.roles.cache.has(requiredRoleID),
        )
        .map((member: GuildMember): string => member.user.id),
    );

    const allowed: string[] = [];
    const skipped: string[] = [];

    // For every Discord ID
    for (const discordID of discordIDs) {
      // If the member ID is in the set
      if (membersWithRole.has(discordID)) {
        // Add to the allowed array
        allowed.push(discordID);

        // Otherwise, add to the skipped array
      } else {
        skipped.push(discordID);
      }
    }

    return { allowed, skipped };
  } catch {
    return { allowed: [], skipped: discordIDs };
  }
}
