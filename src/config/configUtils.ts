import { ElysianSpirit } from "classes/client.js";
import { getConfig, GuildConfig } from "config/configLoader.js";
import { CHANNEL_KEY } from "constants/channels.js";
import { LOADER_MESSAGE } from "constants/messages/loaderMessages.js";
import { ROLE_KEY } from "constants/roles.js";
import { Guild } from "discord.js";
import { EphemeralError } from "utils/errorUtils.js";
import {
  reportValidationResult,
  ValidationReport,
} from "utils/validationUtils.js";

export type ChannelIDs = Record<CHANNEL_KEY, string>;
export type RoleIDs = Record<ROLE_KEY, string>;

let configErrors: Record<string, string[]> = {};

// Getter for config.json errors
export function getConfigErrors(): Record<string, string[]> {
  return configErrors;
}

// Function that gets the GuildConfig
export function getGuildConfig(guildID: string): GuildConfig {
  const guild: GuildConfig = getConfig().GUILDS[guildID];

  if (!guild) {
    throw new EphemeralError(LOADER_MESSAGE.guildConfigMissing(guildID));
  }

  return guild;
}

// Setter for config.json errors
export function setConfigErrors(errors: Record<string, string[]>): void {
  configErrors = errors;
}

// Helper function to get channel IDs for a guild from config.json
export const getChannelIDs: (guildID: string) => ChannelIDs = (
  guildID: string,
): ChannelIDs => {
  return getGuildConfig(guildID).CHANNEL_IDS;
};

// Helper function to get role IDs for a guild from config.json
export const getRoleIDs: (guildID: string) => RoleIDs = (
  guildID: string,
): RoleIDs => {
  return getGuildConfig(guildID).ROLE_IDS;
};

// Helper function to get message-based command prefix from config.json
export function getCommandPrefix(guildID: string): string {
  return getGuildConfig(guildID).PREFIX;
}

// Helper function to get role ID from a ROLE_KEY
export function getRoleID(guildID: string, key: ROLE_KEY): string {
  const roles: RoleIDs = getRoleIDs(guildID);
  return roles[key];
}

// Helper function to report config validation errors or success
export function reportConfigValidation(
  errorsByGuild: Record<string, string[]>,
  context: "reload" | "validate",
): ValidationReport {
  return reportValidationResult(
    errorsByGuild,
    context,
    {
      reload: LOADER_MESSAGE.CONFIG_RELOADED_AND_VALIDATED_SUCCESSFULLY,
      validate: LOADER_MESSAGE.CONFIG_VALIDATED_SUCCESSFULLY,
    },
    "Config",
    "Guild",
  );
}

// Helper function to resolve IDs from ROLE_KEYs or CHANNEL_KEYs
export function resolveIDs<K extends string>(
  keys: K[],
  map: Record<K, string>,
): string[] {
  return keys.map((key: K): Record<K, string>[K] => map[key]);
}

// Function that validates the values in config.json
export function validateConfig(
  client: ElysianSpirit,
): Record<string, string[]> {
  const errorsByGuild: Record<string, string[]> = {};

  for (const guildID in getConfig().GUILDS) {
    const errors: string[] = [];
    const guild: Guild | undefined = client.guilds.cache.get(guildID);

    if (!guild) {
      errors.push(LOADER_MESSAGE.guildNotFound(guildID));
      errorsByGuild[guildID] = errors;
      continue;
    }

    const guildConfig: GuildConfig = getGuildConfig(guildID);

    for (const channelID of Object.values(guildConfig.CHANNEL_IDS ?? {})) {
      if (!guild.channels.cache.has(channelID)) {
        errors.push(LOADER_MESSAGE.channelNotFound(guildID, channelID));
      }
    }

    for (const roleID of Object.values(guildConfig.ROLE_IDS ?? {})) {
      if (!guild.roles.cache.has(roleID)) {
        errors.push(LOADER_MESSAGE.roleNotFound(guildID, roleID));
      }
    }

    errorsByGuild[guildID] = errors;
  }

  setConfigErrors(errorsByGuild);

  return errorsByGuild;
}
