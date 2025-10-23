import { EMOJIS } from "constants/emojis.js";
import { bold, userMention } from "discord.js";
import { formatNumber } from "utils/formatUtils.js";

export const DAYS_MESSAGES = {
  BOTS_NO_DAYS: `${EMOJIS.ERROR} You can't check this for bots.`,

  days: (label: string, numberOfDays: number): string => {
    return `${EMOJIS.DATE} ${label} been in the clan for ${bold(formatNumber(numberOfDays))} days.`;
  },

  daysNotFound: (label: string): string =>
    `${EMOJIS.ERROR} ${label} no days recorded in the spreadsheet.`,

  gettingDays: (label: string): string => {
    return `${EMOJIS.CHECKING} Checking how long ${label.toLowerCase()} been in the clan...`;
  },

  label: (isSelf: boolean, memberID: string): string => {
    return isSelf ? "You have" : `${userMention(memberID)} has`;
  },

  NOT_ENABLED: `${EMOJIS.ERROR} This feature is not enabled for this server.`,
} as const;
