import { EMOJIS } from "constants/emojis.js";
import { bold } from "discord.js";
import { pluralise } from "utils/formatUtils.js";

export const ACTIVITY_MESSAGE = {
  alreadyDeRankedMembers: (count: number): string => {
    return `${EMOJIS.INFO} ${bold(String(count))} already de-ranked ${pluralise(count, "member")}:`;
  },

  CHECKING: `${EMOJIS.CHECKING} Checking inactivity...`,

  deRankedMembers: (count: number): string => {
    return `${EMOJIS.DE_RANKED} ${bold(String(count))} de-ranked ${pluralise(count, "member")}:`;
  },

  DERANKING: `${EMOJIS.CHECKING} De-ranking member...`,

  deRankMembers: (count: number, days: number): string => {
    return `${EMOJIS.DE_RANKED} De-ranking ${pluralise(count, "member")} inactive for ${bold(`${String(days)} ${pluralise(days, "day")}`)} or longer`;
  },

  inactiveMembers: (count: number, days: number): string => {
    return `${EMOJIS.INACTIVE} Inactive ${pluralise(count, "member")} for ${bold(`${String(days)} ${pluralise(days, "day")}`)} or longer`;
  },

  NO_INACTIVE_MEMBERS_FOUND: `${EMOJIS.INFO} No inactive members found`,
  NO_MEMBERS_FOUND_TO_DERANK: `${EMOJIS.INFO} No inactive members found to de-rank.`,

  noInactiveMembers: (days: number): string => {
    return `${EMOJIS.INFO} No members have been inactive for ${bold(`${String(days)} ${pluralise(days, "day")}`)} or longer.`;
  },
} as const;
