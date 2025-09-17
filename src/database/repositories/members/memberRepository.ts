import { REPOSITORY_MESSAGES } from "constants/messages/repositoryMessages.js";
import { prisma } from "database/client.js";
import { ensureGuild } from "database/repositories/guilds/guildRepository.js";
import { Collection, Guild, GuildMember } from "discord.js";
import { Member } from "src/generated/prisma/client.js";
import { MemberModel } from "src/generated/prisma/models/Member.js";
import { EphemeralError } from "utils/errorUtils.js";
import { logger } from "utils/logger.js";

// Function that makes sure a Discord members (and the Discord Guild) exists in the database and returns the members
export async function ensureMembers(
  guild: Guild,
  discordIDs: string[],
): Promise<Member[]> {
  try {
    // Ensure guild exists
    await ensureGuild(guild);

    // Find or create the Guild row by Discord guild ID
    await prisma.guild.upsert({
      create: { guildID: guild.id },
      update: {},
      where: { guildID: guild.id },
    });

    // Get all members from a guild in the database
    const existingMembers: MemberModel[] = await prisma.member.findMany({
      where: {
        discordID: { in: discordIDs },
        guildID: guild.id,
      },
    });

    // Find which members do not exist in the database
    const existingIDs = new Set(
      existingMembers.map((member: MemberModel): string => member.discordID),
    );
    const missingIDs: string[] = discordIDs.filter(
      (id: string): boolean => !existingIDs.has(id),
    );

    let humanIDs: string[] = [];

    // If there are members missing from the database
    if (missingIDs.length) {
      // Only fetch missing members from Discord (bots are filtered out)
      const members: Collection<string, GuildMember> =
        await guild.members.fetch({ user: missingIDs });
      humanIDs = members
        .filter((member: GuildMember): boolean => !member.user.bot)
        .map((member: GuildMember): string => member.user.id);

      // If there are non-bot members
      if (humanIDs.length) {
        // For all the Discord IDs, create members in the database
        await prisma.member.createMany({
          data: humanIDs.map(
            (discordID: string): { discordID: string; guildID: string } => ({
              discordID,
              guildID: guild.id,
            }),
          ),
          skipDuplicates: true,
        });
      }
    }

    // Return all members (existing + just created)
    return await prisma.member.findMany({
      where: {
        discordID: { in: discordIDs },
        guildID: guild.id,
      },
    });
  } catch (err) {
    if (err instanceof EphemeralError) {
      throw err;
    }

    logger.error(REPOSITORY_MESSAGES.failedToEnsureMembers(err));
    throw new EphemeralError(REPOSITORY_MESSAGES.UNABLE_TO_ACCESS_MEMBER_DATA);
  }
}

// Function that gets the number of clan points for a Discord member
export async function getClanPoints(
  guild: Guild,
  discordID: string,
): Promise<number> {
  try {
    // Ensure that the member exists in the database
    const [member] = await ensureMembers(guild, [discordID]);

    return member.balance;
  } catch (err) {
    if (err instanceof EphemeralError) {
      throw err;
    }

    logger.error(REPOSITORY_MESSAGES.unableToRetrieveClanPoints(err));
    throw new EphemeralError(
      REPOSITORY_MESSAGES.UNABLE_TO_RETRIEVE_CLAN_POINTS,
    );
  }
}

// Get inactive members for a Discord guild from the database
export async function getInactiveMembers(
  guild: Guild,
  days: number,
): Promise<MemberModel[]> {
  try {
    await ensureGuild(guild);

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await prisma.member.findMany({
      where: {
        guildID: guild.id,
        OR: [
          { lastMessageSentAt: null },
          { lastMessageSentAt: { lt: cutoffDate } },
        ],
      },
    });
  } catch (err) {
    if (err instanceof EphemeralError) {
      throw err;
    }

    logger.error(REPOSITORY_MESSAGES.failedToFetchMembers(err));
    throw new EphemeralError(
      REPOSITORY_MESSAGES.UNABLE_TO_RETRIEVE_INACTIVE_MEMBERS,
    );
  }
}

// Function that updates the timestamp for the last message sent by a Discord member
export async function updateLastMessageSentAt(
  guild: Guild,
  discordID: string,
): Promise<void> {
  try {
    // Ensure that the members exist in the database
    const [member] = await ensureMembers(guild, [discordID]);

    await prisma.member.update({
      data: { lastMessageSentAt: new Date() },
      where: { id: member.id },
    });
  } catch (err) {
    if (err instanceof EphemeralError) {
      throw err;
    }

    logger.error(REPOSITORY_MESSAGES.unableToUpdateMemberActivity(err));
    throw new EphemeralError(
      REPOSITORY_MESSAGES.UNABLE_TO_UPDATE_MEMBER_ACTIVITY,
    );
  }
}
