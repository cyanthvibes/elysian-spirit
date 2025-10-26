import { EMOJIS } from "constants/emojis.js";
import { bold, userMention } from "discord.js";
import {
  formatNumber,
  getMedalEmoji,
  ordinalSuffix,
} from "utils/formatUtils.js";

export const LEADERBOARD_MESSAGES = {
  entry: (index: number, discordID: string, points: number): string => {
    const medal: string = getMedalEmoji(index);

    return `${medal}${ordinalSuffix(index)}. ${userMention(discordID)}: ${formatNumber(points)}\n`;
  },

  FETCHING: `${EMOJIS.CHECKING} Generating a leaderboard...`,

  memberPlacement: (
    placement: number,
    discordID: string,
    points: number,
  ): string => {
    const medal: string = getMedalEmoji(placement);

    return `\n${medal}${ordinalSuffix(placement)}. ${userMention(discordID)}: ${formatNumber(points)}`;
  },

  title: (period: string): string => {
    if (period === "yearly" || period === "monthly") {
      return `${EMOJIS.TROPHY} ${bold(`Clan points top 10 leaderboard (${period === "yearly" ? "this year" : "this month"})`)}`;
    }

    return `${EMOJIS.TROPHY} ${bold("Clan points top 10 leaderboard (all-time)")}`;
  },
} as const;
