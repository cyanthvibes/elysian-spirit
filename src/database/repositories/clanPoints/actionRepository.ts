import { REPOSITORY_MESSAGES } from "constants/messages/repositoryMessages.js";
import { prisma } from "database/client.js";
import { ensureMembers } from "database/repositories/members/memberRepository.js";
import { Guild } from "discord.js";
import { calculateNewBalance } from "src/features/balance/utils.js";
import {
  ClanPointTransaction,
  Member,
  Prisma,
} from "src/generated/prisma/client.js";
import { ActionType } from "src/generated/prisma/enums.js";
import { EphemeralError } from "utils/errorUtils.js";
import { logger } from "utils/logger.js";

// Function that modifies clan points for an array of member in a guild
export async function modifyClanPoints(
  guild: Guild,
  actionType: ActionType,
  discordIDs: string[],
  amount: number | number[],
  reason: string,
  performedByDiscordID: string,
): Promise<{
  finalBalances: Map<string, number>;
  startingBalances: Map<string, number>;
  transactionID: string;
}> {
  try {
    // Ensure that the members exist in the database
    const members: Member[] = await ensureMembers(guild, discordIDs);

    // Ensure that the member that wants to modify clan points also exists in the database
    const [performer] = await ensureMembers(guild, [performedByDiscordID]);

    const membersMap = new Map(
      members.map((member: Member): [string, Member] => [
        member.discordID,
        member,
      ]),
    );

    // Store starting balances
    const startingBalances = new Map<string, number>();

    for (const discordID of discordIDs) {
      const member: Member | undefined = membersMap.get(discordID);
      if (member) {
        startingBalances.set(discordID, member.balance);
      }
    }

    return await prisma.$transaction(
      async (
        tx: Prisma.TransactionClient,
      ): Promise<{
        finalBalances: Map<string, number>;
        startingBalances: Map<string, number>;
        transactionID: string;
      }> => {
        // Create the transaction
        const transaction: ClanPointTransaction =
          await tx.clanPointTransaction.create({
            data: {
              actionType,
              guildID: guild.id,
              performedByID: performer.id,
              reason,
            },
          });

        const finalBalances = new Map<string, number>();

        for (let i = 0; i < discordIDs.length; i++) {
          const discordID: string = discordIDs[i];

          // Find the member to modify
          const memberRecord: Member | null = await tx.member.findUnique({
            where: { id: membersMap.get(discordID)?.id },
          });

          // Continue if the member is not found
          if (!memberRecord) continue;

          // Get the current number of clan points first
          const currentAmount: number =
            Array.isArray(amount) && amount.length === discordIDs.length
              ? amount[i]
              : (amount as number);

          // Calculate the new balance
          const newBalance: number = calculateNewBalance(
            actionType,
            memberRecord.balance,
            currentAmount,
          );

          // Update balance and, if ActionType === DAILY, also update clanPointsLastClaimedAt
          await tx.member.update({
            data: {
              balance: newBalance,
              ...(actionType === ActionType.DAILY && {
                clanPointsLastClaimedAt: new Date(),
              }),
            },
            where: { id: memberRecord.id },
          });

          finalBalances.set(discordID, newBalance);

          // Create the action for the transaction
          await tx.clanPointAction.create({
            data: {
              actionType,
              amount: currentAmount,
              guildID: guild.id,
              performedByID: performer.id,
              previousBalance: memberRecord.balance,
              reason,
              targetMemberID: memberRecord.id,
              transactionID: transaction.id,
            },
          });
        }

        return {
          finalBalances,
          startingBalances,
          transactionID: transaction.id,
        };
      },
    );
  } catch (err) {
    if (err instanceof EphemeralError) {
      throw err;
    }

    logger.error(REPOSITORY_MESSAGES.unableToModifyClanPoints(err));
    throw new EphemeralError(REPOSITORY_MESSAGES.UNABLE_TO_MODIFY_CLAN_POINTS);
  }
}
