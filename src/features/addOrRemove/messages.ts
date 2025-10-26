import { getRoleIDs, RoleIDs } from "config/configUtils.js";
import { EMOJIS } from "constants/emojis.js";
import { bold, roleMention, userMention } from "discord.js";
import { ActionType } from "src/generated/prisma/enums.js";
import { formatNumber, pluralise } from "utils/formatUtils.js";

export const ADD_OR_REMOVE_MESSAGES = {
  addedOrRemoved: (actionType: ActionType): string => {
    return actionType === ActionType.ADD ? "Added" : "Removed";
  },

  addingOrRemoving: (actionType: ActionType): string => {
    return actionType === ActionType.ADD
      ? `${EMOJIS.ADDED} Adding`
      : `${EMOJIS.REMOVED} Removing`;
  },

  contentBlockContent: (
    addedOrRemoved: string,
    amount: number,
    fromOrTo: string,
    memberID: string,
    newBalance: number,
  ): string => {
    return `- ${addedOrRemoved} ${bold(formatNumber(amount))} ${pluralise(amount, "point")} ${fromOrTo} ${userMention(memberID)}. New balance: ${bold(formatNumber(newBalance))}`;
  },

  firstReplyHeader: (addingOrRemoving: string, amount: number): string => {
    return `${EMOJIS.CHECKING} ${addingOrRemoving} ${bold(formatNumber(amount))} ${pluralise(amount, "point")}...`;
  },

  fromOrTo: (actionType: ActionType): string => {
    return actionType === ActionType.ADD ? "to" : "from";
  },

  mainHeader: (
    addingOrRemoving: string,
    amount: number,
    fromOrTo: string,
    count: number,
    reason: string,
  ): string => {
    return [
      `${addingOrRemoving} ${bold(formatNumber(amount))} ${pluralise(amount, "point")} ${fromOrTo} ${bold(String(count))} ${pluralise(count, "member")}`,
      `${EMOJIS.REASON} ${bold("Reason")}: ${reason}`,
    ].join("\n");
  },

  NO_VALID_MEMBERS: `${EMOJIS.ERROR} No valid @members found in your input.`,

  noMembersToReceiveClanPoints: (count: number, guildID: string): string => {
    const roleIDs: RoleIDs = getRoleIDs(guildID);

    if (count === 1) {
      return `${EMOJIS.ERROR} That member doesn't have the ${roleMention(roleIDs.MEMBER_PERMS)} role. No clan points were added.`;
    } else {
      return `${EMOJIS.ERROR} None of those members have the ${roleMention(roleIDs.MEMBER_PERMS)} role. No clan points were added.`;
    }
  },

  noMembersToRemoveClanPoints: (count: number, guildID: string): string => {
    const roleIDs: RoleIDs = getRoleIDs(guildID);

    if (count === 1) {
      return `${EMOJIS.ERROR} That member doesn't have the ${roleMention(roleIDs.MEMBER_PERMS)} role. No clan points were removed.`;
    } else {
      return `${EMOJIS.ERROR} None of those members have the ${roleMention(roleIDs.MEMBER_PERMS)} role. No clan points were removed.`;
    }
  },

  skipped: (skipped: string[], guildID: string): string =>
    `Skipped ${bold(String(skipped.length))} ${pluralise(skipped.length, "member")} (missing ${roleMention(getRoleIDs(guildID).MEMBER_PERMS)} role):`,
} as const;
