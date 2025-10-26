import {
  MAX_TRANSACTION_DAYS,
  MAX_TRANSACTION_LIMIT,
} from "constants/clanPoints.js";
import { EMOJIS } from "constants/emojis.js";
import { bold, italic, User, userMention } from "discord.js";
import { ActionType } from "src/generated/prisma/enums.js";
import { formatNumber } from "utils/formatUtils.js";

export const TRANSACTION_MESSAGES = {
  actionLine: (
    discordID: string,
    previousBalance: null | number | undefined,
    newBalance: number,
    amountPrefix: string,
    amount: number,
    actionType: ActionType,
  ): string => {
    const str = [
      `- ${userMention(discordID)}: ${formatNumber(previousBalance ?? 0)} → ${formatNumber(newBalance)} (${amountPrefix}${formatNumber(amount)})`,
    ];

    if (actionType === ActionType.HISTORY) {
      str.push("- ...actions affecting other members omitted");
    }

    return str.join("\n");
  },

  FIRST_REPLY_HEADER: `${EMOJIS.CHECKING} Getting transactions....`,

  header: (
    target: User,
    fromDate: string,
    toDate: string,
    actionType: ActionType,
  ): string => {
    return [
      `${EMOJIS.HISTORY} ${bold(`Transaction ${actionType.toLowerCase()} for`)} ${target}`,
      `${EMOJIS.DATE} ${bold("From")} ${fromDate} ${bold("to")} ${toDate}`,
    ].join("\n");
  },

  headerDateCapped: (): string => {
    return `\n${EMOJIS.INFO} ${italic(`Note: Results capped at the last ${MAX_TRANSACTION_DAYS} days.`)}`;
  },

  headerLimitCapped: (): string => {
    return `\n${EMOJIS.INFO} ${italic(`Note: Results capped at the most recent ${MAX_TRANSACTION_LIMIT} transactions.`)}`;
  },

  NO_TRANSACTIONS_FOUND_IN_RANGE: `${EMOJIS.ERROR} No transactions found in the specified date range.`,

  reason: (reason: string): string => {
    return `${EMOJIS.REASON} ${bold("Reason")}: ${reason}`;
  },

  sectionHeader: (
    actionType: ActionType,
    date: string,
    performedByMention: string,
  ): string => {
    let emoji = "";

    if (actionType === ActionType.ADD) {
      emoji = EMOJIS.ADDED;
    } else if (actionType === ActionType.REMOVE) {
      emoji = EMOJIS.REMOVED;
    } else if (actionType === ActionType.TEMPLE) {
      emoji = EMOJIS.TROPHY;
    } else if (actionType === ActionType.UNDO) {
      emoji = EMOJIS.UNDONE;
    } else if (actionType === ActionType.DAILY) {
      emoji = EMOJIS.DATE;
    }

    return `${emoji} ${bold(actionType)} - ${date} by ${performedByMention}`;
  },

  undoneByLine: (discordID: string, time: number): string => {
    return `${italic(`${EMOJIS.UNDONE} Undone by ${userMention(discordID)} at <t:${time}:F>`)}`;
  },
} as const;
