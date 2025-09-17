import { getRoleIDs, RoleIDs } from "config/configUtils.js";
import { EMOJIS } from "constants/emojis.js";
import { channelMention, roleMention } from "discord.js";

export const PERMISSION_MESSAGES = {
  COMMANDS_DISABLED: `${EMOJIS.ERROR} Commands are disabled for now. Please try again later.`,
  NO_PERMISSION: `${EMOJIS.ERROR} You do not have permission to use this command.`,

  noMemberPerms: (guildID: string): string => {
    const roleIDs: RoleIDs = getRoleIDs(guildID);

    return `${EMOJIS.ERROR} You do not have the ${roleMention(roleIDs.MEMBER_PERMS)} role. Did you apply to our clan and are you an active member?`;
  },

  wrongChannel: (channels: string[]): string => {
    return `${EMOJIS.ERROR} Please use this command in ${channels.map((id: string): string => channelMention(id)).join(" or ")}.`;
  },
} as const;
