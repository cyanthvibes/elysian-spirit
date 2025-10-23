import { EMOJIS } from "constants/emojis.js";
import { bold, userMention } from "discord.js";
import { formatNumber } from "utils/formatUtils.js";

export const BALANCE_MESSAGES = {
  balance: (label: string, balance: number): string => {
    return `${EMOJIS.BALANCE} ${label} balance: ${bold(formatNumber(balance))} clan points.`;
  },

  BOTS_NO_CLAN_POINTS: `${EMOJIS.ERROR} Bots don't have clan points.`,
  CHECKING: `${EMOJIS.CHECKING} Getting your clan points...`,

  gettingBalance: (label: string): string => {
    return `${EMOJIS.CHECKING} Getting ${label.toLowerCase()} balance...`;
  },

  invalidActionType: (type: string): string => `Invalid action type: ${type}`,

  label: (isSelf: boolean, memberID: string): string => {
    return isSelf ? "Your" : `${userMention(memberID)}'s`;
  },
} as const;
