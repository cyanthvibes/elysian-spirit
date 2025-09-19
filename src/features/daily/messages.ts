import { EMOJIS } from "constants/emojis.js";
import { bold, time, TimestampStyles } from "discord.js";
import { formatNumber } from "utils/formatUtils.js";

export const DAILY_MESSAGES = {
  CHECKING: `${EMOJIS.CHECKING} Checking if you can claim your daily clan points...`,

  error: (timeUntilNextClaim: string, timestamp: number): string => {
    return `${EMOJIS.ERROR} You've already claimed your clan points today.\n${EMOJIS.DATE} Come back in ${bold(timeUntilNextClaim)}. (${time(timestamp, TimestampStyles.LongDateTime)})`;
  },

  success: (amount: number, balance: number | undefined): string => {
    return `${EMOJIS.YAY} You've successfully claimed your ${bold(String(amount))} daily clan points.\n${EMOJIS.BALANCE} New balance is ${bold(formatNumber(balance))} clan points.`;
  },
} as const;
