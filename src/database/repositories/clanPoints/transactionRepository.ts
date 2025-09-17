import { REPOSITORY_MESSAGES } from "constants/messages/repositoryMessages.js";
import { prisma } from "database/client.js";
import { ensureGuild } from "database/repositories/guilds/guildRepository.js";
import { ensureMembers } from "database/repositories/members/memberRepository.js";
import { Guild } from "discord.js";
import { DateTime } from "luxon";
import { calculateNewBalance } from "src/features/balance/utils.js";
import {
  ClanPointTransaction,
  Member,
  Prisma,
} from "src/generated/prisma/client.js";
import { ActionType } from "src/generated/prisma/enums.js";
import { EphemeralError } from "utils/errorUtils.js";
import { logger } from "utils/logger.js";

// Function that gets transactions from the database
export async function getClanPointsTransactions(
  guild: Guild,
  from: DateTime,
  to: DateTime,
  targetDiscordID?: string,
  performedByDiscordID?: string,
  includeDaily = false,
  limit?: number,
): Promise<ClanPointTransaction[]> {
  try {
    // Ensure guild exists
    await ensureGuild(guild);

    const actionTypes: ActionType[] = [
      ActionType.ADD,
      ActionType.REMOVE,
      ActionType.UNDO,
      ActionType.TEMPLE,
    ];

    if (includeDaily) {
      actionTypes.push(ActionType.DAILY);
    }

    const where: Prisma.ClanPointTransactionWhereInput = {
      actionType: {
        in: actionTypes,
      },
      createdAt: { gte: from.toJSDate(), lte: to.toJSDate() },
      guildID: guild.id,
    };

    if (targetDiscordID) {
      where.actions = {
        some: { targetMember: { discordID: targetDiscordID } },
      };
    }

    if (performedByDiscordID) {
      where.performedBy = { discordID: performedByDiscordID };
    }

    return await prisma.clanPointTransaction.findMany({
      include: {
        actions: { include: { targetMember: true } },
        performedBy: true,
        undoneBy: true,
        undoOf: {
          include: {
            actions: { include: { targetMember: true } },
            performedBy: true,
            undoneBy: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      where,
    });
  } catch (err) {
    if (err instanceof EphemeralError) {
      throw err;
    }

    logger.error(REPOSITORY_MESSAGES.unableToFetchTransactions(err));
    throw new EphemeralError(REPOSITORY_MESSAGES.UNABLE_TO_GET_TRANSACTIONS);
  }
}

// Function that undoes a transaction
export async function undoTransaction(
  guild: Guild,
  transactionID: string,
  undoneByDiscordID: string,
): Promise<string> {
  try {
    // Ensure the member that wants to undo a transaction exists in the database
    const [undoneBy] = await ensureMembers(guild, [undoneByDiscordID]);

    if (!undoneBy) {
      throw new EphemeralError(REPOSITORY_MESSAGES.UNABLE_TO_GET_UNDO_MEMBERS);
    }

    return await prisma.$transaction(
      async (tx: Prisma.TransactionClient): Promise<string> => {
        // Get the transaction from the database using transaction ID
        const transaction: null | Prisma.ClanPointTransactionGetPayload<{
          include: { actions: true };
        }> = await tx.clanPointTransaction.findUnique({
          include: { actions: true },
          where: { id: transactionID },
        });

        // If the transaction wasn't found
        if (!transaction)
          throw new EphemeralError(REPOSITORY_MESSAGES.TRANSACTION_NOT_FOUND);

        // If the transaction was already undone
        if (transaction.undone)
          throw new EphemeralError(
            REPOSITORY_MESSAGES.TRANSACTION_HAS_ALREADY_BEEN_UNDONE,
          );

        // Create the transaction that undoes the provided transaction
        const undoTransaction = await tx.clanPointTransaction.create({
          data: {
            actionType: ActionType.UNDO,
            guildID: guild.id,
            performedByID: undoneBy.id,
            reason: `Undo of transaction ${transaction.id}`,
            undoOfID: transaction.id,
          },
        });

        // Undo every action inside the provided transaction
        for (const action of transaction.actions) {
          const member: Member | null = await tx.member.findUnique({
            where: { id: action.targetMemberID },
          });

          if (!member) continue;

          let inverseType: ActionType;

          switch (action.actionType) {
            case ActionType.ADD:
            case ActionType.DAILY:
            case ActionType.TEMPLE:
              inverseType = ActionType.REMOVE;
              break;
            case ActionType.REMOVE:
              inverseType = ActionType.ADD;
              break;
            default:
              continue;
          }

          const newBalance: number = calculateNewBalance(
            inverseType,
            member.balance,
            action.amount,
          );

          // Update the balance for the member
          await tx.member.update({
            data: { balance: newBalance },
            where: { id: member.id },
          });

          // Create the action for the undo-transaction
          await tx.clanPointAction.create({
            data: {
              actionType: ActionType.UNDO,
              amount: action.amount,
              guildID: guild.id,
              performedByID: undoneBy.id,
              previousBalance: member.balance,
              reason: `Undo of transaction ${transaction.id}`,
              targetMemberID: member.id,
              transactionID: undoTransaction.id,
            },
          });
        }

        // Update the provided transaction so that it is flagged as undone
        await tx.clanPointTransaction.update({
          data: { undone: true, undoneAt: new Date(), undoneByID: undoneBy.id },
          where: { id: transactionID },
        });

        return transaction.id;
      },
    );
  } catch (err) {
    if (err instanceof EphemeralError) {
      throw err;
    }

    logger.error(REPOSITORY_MESSAGES.unableToUndoTransactions(err));
    throw new EphemeralError(REPOSITORY_MESSAGES.UNABLE_TO_UNDO_TRANSACTION);
  }
}
