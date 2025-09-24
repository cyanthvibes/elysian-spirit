import { Prisma } from "@prisma/client";
import { createTransactionIDLine } from "constants/strings.js";
import { getClanPointsTransactions } from "database/repositories/clanPoints/transactionRepository.js";
import {
  ContainerBuilder,
  strikethrough,
  time,
  TimestampStyles,
  User,
  userMention,
} from "discord.js";
import { DateTime } from "luxon";
import { calculateNewBalance } from "src/features/balance/utils.js";
import { TRANSACTION_MESSAGES } from "src/features/transaction/historyAndAudit/messages.js";
import { ActionType } from "src/generated/prisma/enums.js";
import { ContainerStyle, MessageBlock } from "types/container.js";
import { buildContainers } from "utils/containers/containersBuilder.js";
import {
  createContentBlock,
  createMainHeader,
} from "utils/containers/containersUtils.js";

interface TransactionAction {
  amount: number;
  previousBalance: null | number | undefined;
  targetMember: { discordID: string };
}

// Function that creates containers for /transactions audit and /transactions history from blocks
export function buildTransactionHistoryOrAuditContainers(
  dateCapped: boolean,
  from: DateTime,
  limitCapped: boolean,
  target: User,
  to: DateTime,
  transactions: Awaited<ReturnType<typeof getClanPointsTransactions>>,
): ContainerBuilder[] {
  const blocks: MessageBlock[] = [];

  // If there are no transactions, send a simple message
  if (transactions.length === 0) {
    blocks.push(
      createMainHeader(TRANSACTION_MESSAGES.NO_TRANSACTIONS_FOUND_IN_RANGE),
    );

    // If there are transactions
  } else {
    // Format dates to Discord timestamps
    const fromDate = `${time(Math.floor(from.toSeconds()), TimestampStyles.LongDateTime)}`;
    const toDate = `${time(Math.floor(to.toSeconds()), TimestampStyles.LongDateTime)}`;

    // Create the header
    let header: string = TRANSACTION_MESSAGES.header(target, fromDate, toDate);

    if (dateCapped) {
      header += TRANSACTION_MESSAGES.headerDateCapped();
    }

    if (limitCapped) {
      header += TRANSACTION_MESSAGES.headerLimitCapped();
    }

    blocks.push(createMainHeader(header));

    // For every transaction
    transactions.forEach((transaction: Prisma.TransactionClient): void => {
      const {
        actions,
        actionType,
        createdAt,

        performedBy,
        reason,
        undoneAt,
        undoneBy,
      } = transaction;

      // Format transaction date to Discord timestamp
      const date = `${time(Math.floor(createdAt.getTime() / 1000), TimestampStyles.ShortDateTime)}`;

      // Format performed member mention
      const performedByMention = `${userMention(performedBy.discordID)}`;

      // Create section header and reason line
      let sectionHeader: string = TRANSACTION_MESSAGES.sectionHeader(
        actionType,
        date,
        performedByMention,
      );
      const reasonLine: string = TRANSACTION_MESSAGES.reason(reason);

      // Format all transactions in a transaction to a line
      const actionLines: string[] = actions.map(
        (action: TransactionAction): string => {
          const { amount, previousBalance, targetMember } = action;

          let newBalance: number;
          let amountPrefix: string;

          if (actionType === ActionType.UNDO) {
            newBalance = (previousBalance ?? 0) + amount;
            amountPrefix = amount >= 0 ? "+" : "-";
          } else {
            newBalance = calculateNewBalance(
              actionType,
              previousBalance ?? 0,
              amount,
            );

            amountPrefix =
              actionType === ActionType.ADD ||
              actionType === ActionType.TEMPLE ||
              actionType === ActionType.DAILY
                ? "+"
                : "-";
          }

          return TRANSACTION_MESSAGES.actionLine(
            targetMember.discordID,
            previousBalance,
            newBalance,
            amountPrefix,
            Math.abs(amount),
          );
        },
      );

      // Create transaction string
      const transactionLine: string = createTransactionIDLine(transaction.id);

      let content: string[] = [reasonLine, ...actionLines, transactionLine];

      if (undoneAt && undoneBy) {
        sectionHeader = `${strikethrough(sectionHeader)}`;

        content = content.map(
          (line: string): string => `${strikethrough(line)}`,
        );

        const undoneAtTimestamp: number = Math.floor(undoneAt.getTime() / 1000);

        content.push(
          TRANSACTION_MESSAGES.undoneByLine(
            undoneBy.discordID,
            undoneAtTimestamp,
          ),
        );
      }

      const groupedLines: string[] = [];

      // Only one transaction line: group everything together to prevent splitting
      if (actionLines.length === 1) {
        let singleBlock: string =
          sectionHeader +
          "\n" +
          reasonLine +
          "\n" +
          actionLines[0] +
          "\n" +
          transactionLine;

        // If undone line exists, append it
        if (content.length > actionLines.length + 2) {
          singleBlock += "\n\n" + content[content.length - 1];
        }

        groupedLines.push(singleBlock);

        // Multiple transaction lines: group header + reason + first transaction line
      } else {
        groupedLines.push(
          sectionHeader + "\n" + reasonLine + "\n" + actionLines[0],
        );

        // Middle transaction lines
        for (let i = 1; i < actionLines.length - 1; i++) {
          groupedLines.push(actionLines[i]);
        }

        // Group last transaction line with transaction ID
        let lastGroup: string =
          actionLines[actionLines.length - 1] + "\n" + transactionLine;

        // If undone line exists, group with transaction ID
        if (content.length > actionLines.length + 2) {
          lastGroup += "\n\n" + content[content.length - 1];
        }

        groupedLines.push(lastGroup);
      }

      blocks.push(createContentBlock(groupedLines, undefined));
    });
  }

  const containerStyle: ContainerStyle =
    transactions.length === 0 ? ContainerStyle.ERROR : ContainerStyle.INFO;

  return buildContainers(containerStyle, blocks);
}
