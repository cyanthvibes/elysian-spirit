import { ElysianSpirit } from "classes/client.js";
import { env } from "config/envLoader.js";
import { PERMISSION_MESSAGES } from "constants/messages/permissionMessages.js";
import {
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  GuildMember,
  Message,
} from "discord.js";
import { ADD_OR_REMOVE_MESSAGES } from "src/features/addOrRemove/messages.js";
import { ActionType } from "src/generated/prisma/enums.js";
import { EphemeralError, SilentError } from "utils/errorUtils.js";

// Function that checks if a member has the required roles and if the interaction is used in an allowed channel
export async function checkInteractionPermissions(
  interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
  requiredRoles: string[],
  allowedChannelIDs: string[],
  roleMap: Record<string, string>,
  command: { isPrivileged?: boolean },
): Promise<void> {
  if (!interaction.guild) return;
  const member: GuildMember = interaction.member as GuildMember;

  const client = interaction.client as ElysianSpirit;

  const isEnabled: boolean =
    client.guildCommandsEnabledStateCache.get(interaction.guild.id) ?? false;
  const isOwner: boolean = member.id === env.OWNER_ID;
  const isStaff: boolean = member.roles.cache.has(roleMap.CLAN_STAFF);

  // Always allow if the member is the owner
  if (isOwner) {
    return;
  }

  // If commands are disabled for the guild, if the member is not the owner,
  // and if the interaction has "isPrivileged" set to true, reply that messages are disabled
  if (!isEnabled && !isOwner && !command.isPrivileged) {
    throw new EphemeralError(PERMISSION_MESSAGES.COMMANDS_DISABLED);
  }

  // Always allow if the member has staff permissions
  if (isStaff) {
    return;
  }

  // Check for required roles
  if (requiredRoles.length > 0) {
    const hasRequiredRole: boolean = requiredRoles.every(
      (roleID: string): boolean => member.roles.cache.has(roleID),
    );

    if (!hasRequiredRole) {
      if (
        requiredRoles.includes(roleMap.MEMBER_PERMS) &&
        !member.roles.cache.has(roleMap.MEMBER_PERMS)
      ) {
        throw new EphemeralError(
          PERMISSION_MESSAGES.noMemberPerms(interaction.guild.id),
        );
      }
      throw new EphemeralError(PERMISSION_MESSAGES.NO_PERMISSION);
    }
  }

  // Check for allowed channels
  if (
    allowedChannelIDs.length > 0 &&
    !allowedChannelIDs.includes(interaction.channelId)
  ) {
    throw new EphemeralError(
      PERMISSION_MESSAGES.wrongChannel(allowedChannelIDs),
    );
  }
}

// Function that checks if a member has the required roles and if the message-based command is used in an allowed channel
export function checkMessageCommandPermissions(
  message: Message,
  requiredRoles: string[],
  allowedChannelIDs: string[],
  roleMap: Record<string, string>,
  ownerOnly: boolean,
): void {
  // Always allow is the author is the owner
  if (message.author.id === env.OWNER_ID) {
    return;
  }

  // If command is owner-only and member is not owner
  if (ownerOnly) {
    // Silently fail
    throw new SilentError();
  }

  // For non-owner members, only allow in guilds
  if (!message.guild) {
    // Silently fail
    throw new SilentError();
  }

  // Always allow if the member has staff permissions
  if (message.member?.roles.cache.has(roleMap.CLAN_STAFF)) {
    return;
  }

  // Check for required roles
  if (requiredRoles.length > 0) {
    const hasRequiredRole: boolean = requiredRoles.every(
      (roleID: string): boolean | undefined =>
        message.member?.roles.cache.has(roleID),
    );

    if (!hasRequiredRole) {
      if (
        requiredRoles.includes(roleMap.MEMBER_PERMS) &&
        !message.member?.roles.cache.has(roleMap.MEMBER_PERMS)
      ) {
        throw new EphemeralError(
          PERMISSION_MESSAGES.noMemberPerms(message.guild.id),
        );
      }
      throw new EphemeralError(PERMISSION_MESSAGES.NO_PERMISSION);
    }
  }

  // Check for allowed channels
  if (
    allowedChannelIDs.length > 0 &&
    !allowedChannelIDs.includes(message.channelId)
  ) {
    throw new EphemeralError(
      PERMISSION_MESSAGES.wrongChannel(allowedChannelIDs),
    );
  }
}

// Helper function that throws error if the array of allowed members is empty
export function makeSureMembersWithPermsExist(
  allowed: string[],
  skipped: string[],
  actionType: ActionType,
  interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
): void {
  if (!interaction.guild) return;

  if (allowed.length === 0) {
    const message: string =
      actionType === ActionType.ADD || actionType === ActionType.TEMPLE
        ? ADD_OR_REMOVE_MESSAGES.noMembersToReceiveClanPoints(
            skipped.length,
            interaction.guild.id,
          )
        : ADD_OR_REMOVE_MESSAGES.noMembersToRemoveClanPoints(
            skipped.length,
            interaction.guild.id,
          );

    throw new EphemeralError(message);
  } else {
    return;
  }
}
