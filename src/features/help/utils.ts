import { ElysianSpirit } from "classes/client.js";
import { getRoleIDs, RoleIDs } from "config/configUtils.js";
import { env } from "config/envLoader.js";
import { ROLE_KEYS } from "constants/roles.js";
import {
  APIApplicationCommandBasicOption,
  APIApplicationCommandOption,
  APIApplicationCommandSubcommandOption,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  chatInputApplicationCommandMention,
  ContextMenuCommandType,
  ToAPIApplicationCommandOptions,
} from "discord.js";

export interface AccessibleHelpEntry {
  description: string;
  isMention: boolean;
  isSubcommand: boolean;
  mention: string;
  name: string;
  options: CommandOptions[];
  types: ApplicationCommandType[];
}

// Type for command options (arguments)
export interface CommandOptions {
  description: string;
  name: string;
  required: boolean;
}

// Function that builds help entries for all accessible commands and subcommands
// Note: commands like "/clan-points add" and "/clan-points remove" are subcommands themselves
export function getAccessibleHelpEntries(
  client: ElysianSpirit,
  guildID: string,
  userRoleIDs: Set<string>,
): AccessibleHelpEntry[] {
  // Get role IDs for the guild
  const roleIDs: RoleIDs = getRoleIDs(guildID);

  // Get staff role ID
  const staffRoleID: string | undefined = roleIDs[ROLE_KEYS.CLAN_STAFF];

  // Check if the user is a staff member
  const isStaff: boolean =
    staffRoleID !== undefined && userRoleIDs.has(staffRoleID);

  // Create a map for all /help entries
  const entryMap = new Map<string, AccessibleHelpEntry>();

  // Iterate over all slash commands
  for (const [name, command] of client.slashCommands) {
    // Skip this command if user is not staff and command requires the staff role
    if (!isStaff && command.requiredRoleKeys?.includes(ROLE_KEYS.CLAN_STAFF)) {
      continue;
    }

    let commandID: string | undefined;

    // First, check if the interaction was run in the test server
    if (guildID === env.TEST_GUILD_ID) {
      // Get the command ID from the guild cache
      commandID = client.getCommandID(name, guildID);

      // If the interaction was not from the test server
    } else {
      // Get the command ID from the global cache
      commandID = client.getCommandID(name);
    }

    // Format a mention from the command ID. Otherwise, it defaults to just the command name
    const mention: string = commandID
      ? chatInputApplicationCommandMention(name, commandID)
      : name;

    // If a command ID wasn't found, then creating a mention from it also doesn't work
    const isMention = !!commandID;

    let subcommands: APIApplicationCommandSubcommandOption[] = [];
    let hasSubcommands = false;

    // Check if the command has options, and if options is an array
    if (Array.isArray(command.data.options)) {
      // Convert all options to JSON
      const optionsJSON: APIApplicationCommandOption[] =
        command.data.options.map(
          (
            option: ToAPIApplicationCommandOptions,
          ): APIApplicationCommandOption => option.toJSON(),
        );

      // Keep only the options that are a subcommand
      subcommands = optionsJSON.filter(
        (
          option: APIApplicationCommandOption,
        ): option is APIApplicationCommandSubcommandOption =>
          option.type === ApplicationCommandOptionType.Subcommand,
      );

      // Change boolean
      hasSubcommands = subcommands.length > 0;
    }

    // If the command has subcommands
    if (hasSubcommands) {
      for (const subcommand of subcommands) {
        const subcommandName = `${name} ${subcommand.name}`;

        let subcommandID: string | undefined;

        // First, check if the interaction was run in the test server
        if (guildID === env.TEST_GUILD_ID) {
          // Get the subcommand ID from the guild cache
          subcommandID = client.getSubcommandID(name, subcommand.name, guildID);

          // If the interaction was not from the test server
        } else {
          // Get the subcommand ID from the global cache
          subcommandID = client.getSubcommandID(name, subcommand.name);
        }

        // Format a mention from the command ID. Otherwise, it defaults to just the command name
        const subcommandMention: string =
          subcommandID && subcommandID.includes(":")
            ? chatInputApplicationCommandMention(
                name,
                subcommand.name,
                subcommandID.split(":")[0],
              )
            : subcommandName;

        // If a command ID wasn't found, then creating a mention from it also doesn't work
        const subIsMention = !!(subcommandID && subcommandID.includes(":"));

        let subcommandOptions: CommandOptions[] = [];

        // Check if the subcommand also has options, and if options is an array
        if (Array.isArray(subcommand.options)) {
          subcommandOptions = subcommand.options.map(
            (option: APIApplicationCommandBasicOption): CommandOptions => ({
              description: option.description,
              name: option.name,
              required: Boolean(option.required),
            }),
          );
        }

        // Add the subcommand to /help entries
        entryMap.set(subcommandName, {
          description: subcommand.description,
          isMention: subIsMention,
          isSubcommand: true,
          mention: subcommandMention,
          name: subcommandName,
          options: subcommandOptions,
          types: [ApplicationCommandType.ChatInput],
        });
      }

      // If the command has no subcommands
    } else {
      let options: CommandOptions[] = [];
      // Check if the command has options, and if options is an array
      if (Array.isArray(command.data.options)) {
        // Convert all options to JSON
        options = command.data.options
          .map(
            (
              option: ToAPIApplicationCommandOptions,
            ): APIApplicationCommandOption => option.toJSON(),
          )
          // Filter out subcommands and subcommand groups
          .filter(
            (
              option: APIApplicationCommandOption,
            ): option is APIApplicationCommandBasicOption =>
              option.type !== ApplicationCommandOptionType.Subcommand &&
              option.type !== ApplicationCommandOptionType.SubcommandGroup,
          )
          .map(
            (option: APIApplicationCommandBasicOption): CommandOptions => ({
              description: option.description,
              name: option.name,
              required: Boolean(option.required),
            }),
          );
      }

      // Add command to /help entries
      entryMap.set(name, {
        description: command.data.description,
        isMention,
        isSubcommand: false,
        mention,
        name,
        options,
        types: [ApplicationCommandType.ChatInput],
      });
    }
  }

  // Iterate over all context-menu commands
  for (const [name, command] of client.contextMenuCommands) {
    // Skip this command if user is not staff and command requires the staff role
    if (!isStaff && command.requiredRoleKeys?.includes(ROLE_KEYS.CLAN_STAFF))
      continue;

    const type: ContextMenuCommandType = command.data.type;

    // If a command with the same name exists
    if (entryMap.has(name)) {
      // Get a reference to that command from /help entries
      const existing: AccessibleHelpEntry | undefined = entryMap.get(name);

      // Check if that command doesn't have the same type
      if (existing && !existing.types.includes(type)) {
        // Add this context-menu type to that reference
        existing.types.push(type);
      }

      // Otherwise, if a name with the same name doesn't exist
    } else {
      // Add the context-menu command to /help entries
      entryMap.set(name, {
        description: command.description,
        isMention: false,
        isSubcommand: false,
        mention: name,
        name,
        options: [],
        types: [type],
      });
    }
  }

  // Return all /help entries
  return Array.from(entryMap.values());
}
