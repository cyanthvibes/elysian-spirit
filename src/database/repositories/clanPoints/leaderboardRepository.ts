import { prisma } from "database/client.js";
import { ensureGuild } from "database/repositories/guilds/guildRepository.js";
import { Guild } from "discord.js";

// Function that gets the top N members by balance for all-time from the database
export async function getAllTimeClanPointsLeaderboard(
  guild: Guild,
): Promise<{ discordID: string; points: number }[]> {
  // Ensure guild exists
  await ensureGuild(guild);

  // Fetch all members sorted by balance descending
  const members: { balance: number; discordID: string }[] =
    await prisma.member.findMany({
      orderBy: { balance: "desc" },
      select: { balance: true, discordID: true },
      where: { guildID: guild.id },
    });

  // Map all members to discordID and points
  return members.map((member: { balance: number; discordID: string }) => ({
    discordID: member.discordID,
    points: member.balance,
  }));
}

// Function that gets the top N members by balance for a period from the database
export async function getPeriodClanPointsLeaderboard(
  guild: Guild,
  from: Date,
  to: Date,
): Promise<{ discordID: null | string; points: null | number }[]> {
  // Ensure guild exists
  await ensureGuild(guild);

  // Group actions by targetMemberID, sum all amounts,
  // and only for actionType = ADD/DAILY, which are not undone
  const results = await prisma.clanPointAction.groupBy({
    _sum: { amount: true },
    by: ["targetMemberID"],
    where: {
      actionType: { in: ["ADD", "DAILY", "TEMPLE"] },
      guildID: guild.id,
      transaction: {
        createdAt: { gte: from, lt: to },
        undone: false,
      },
    },
  });

  // Get all unique member IDs from the results
  const memberIDs: string[] = results.map((r): string => r.targetMemberID);

  // Fetch all discordIDs for the unique members
  const members: { discordID: string; id: string }[] =
    await prisma.member.findMany({
      select: { discordID: true, id: true },
      where: { id: { in: memberIDs } },
    });

  // Map all members to cuid and points
  const memberMap = new Map(
    members.map(
      (member: { discordID: string; id: string }): [string, string] => [
        member.id,
        member.discordID,
      ],
    ),
  );

  // Map results to discordID and points, filter out missing and 0 or less, then sort
  return results
    .map((result): { discordID: null | string; points: number } => ({
      discordID: memberMap.get(result.targetMemberID) ?? null,
      points: result._sum.amount || 0,
    }))
    .filter(
      (result: {
        discordID: null | string;
        points: number;
      }): "" | boolean | null => result.discordID && result.points > 0,
    )
    .sort(
      (
        a: { discordID: null | string; points: number },
        b: { discordID: null | string; points: number },
      ): number => b.points - a.points,
    );
}
