import { ContextMenuCommand } from "classes/contextMenuCommand.js";
import { MessageCommand } from "classes/messageCommand.js";
import { SlashCommand } from "classes/slashCommand.js";
import { env } from "config/envLoader.js";
import { ELYSIAN_SPIRIT_CLIENT_MESSAGES } from "constants/messages/elysianSpiritClientMessages.js";
import {
  ApplicationCommand,
  ApplicationCommandOption,
  ApplicationCommandOptionType,
  Client,
  Collection,
  Guild,
  GuildResolvable,
  IntentsBitField,
  Partials,
} from "discord.js";
import { loadContextMenuCommands } from "loaders/contextMenuCommandsLoader.js";
import { loadEvents } from "loaders/eventsLoader.js";
import { loadMessageCommands } from "loaders/messageCommandsLoader.js";
import { loadSlashCommands } from "loaders/slashCommandsLoader.js";
import { logger } from "utils/logger.js";

// Define the ElysianSpirit class, extending Discord.js Client
export class ElysianSpirit extends Client {
  // Collection to store context-menu commands
  contextMenuCommands: Collection<string, ContextMenuCommand> = new Collection<
    string,
    ContextMenuCommand
  >();

  // Cache for global commands IDs
  globalCommandIDCache: Map<
    string,
    { id: string; subcommands: Map<string, string> }
  > = new Map<string, { id: string; subcommands: Map<string, string> }>();

  // Cache for guild commands IDs
  guildCommandIDCache: Map<
    string,
    Map<string, { id: string; subcommands: Map<string, string> }>
  > = new Map<
    string,
    Map<string, { id: string; subcommands: Map<string, string> }>
  >();

  // Cache that tracks whether a guild has commands enabled or disabled
  guildCommandsEnabledStateCache: Map<string, boolean> = new Map<
    string,
    boolean
  >();

  // Collection to store message commands
  messageCommands: Collection<string, MessageCommand> = new Collection<
    string,
    MessageCommand
  >();

  // Collection to store slash commands
  slashCommands: Collection<string, SlashCommand> = new Collection<
    string,
    SlashCommand
  >();

  constructor() {
    super({
      // Define the required intents for the bot to function correctly
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildModeration,
        IntentsBitField.Flags.GuildExpressions,
        IntentsBitField.Flags.GuildIntegrations,
        IntentsBitField.Flags.GuildWebhooks,
        IntentsBitField.Flags.GuildInvites,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildMessageTyping,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.DirectMessageReactions,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildScheduledEvents,
        IntentsBitField.Flags.AutoModerationConfiguration,
        IntentsBitField.Flags.AutoModerationExecution,
        IntentsBitField.Flags.GuildMessagePolls,
        IntentsBitField.Flags.DirectMessagePolls,
      ],
      partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.GuildScheduledEvent,
        Partials.Message,
        Partials.Reaction,
        Partials.ThreadMember,
        Partials.User,
      ],
    });
  }

  // Cache global and guild command IDs
  async cacheAllCommandIDs(): Promise<void> {
    // Cache global commands
    const globalCommands:
      | Collection<string, ApplicationCommand<{ guild: GuildResolvable }>>
      | undefined = await this.application?.commands.fetch();

    this.globalCommandIDCache.clear();

    globalCommands?.forEach(
      (command: ApplicationCommand<{ guild: GuildResolvable }>): void => {
        const subMap = new Map<string, string>();

        // If a command has options
        if (command.options) {
          command.options.forEach((option: ApplicationCommandOption): void => {
            // Check if the option is a subcommand
            if (option.type === ApplicationCommandOptionType.Subcommand) {
              subMap.set(option.name, `${command.id}:${option.name}`);
            }
          });
        }

        this.globalCommandIDCache.set(command.name, {
          id: command.id,
          subcommands: subMap,
        });
      },
    );

    // Only cache commands for the test guild
    const testGuildID: string | undefined =
      process.env.TEST_GUILD_ID || env.TEST_GUILD_ID;

    // If a test guild ID is provided, and the bot is in that guild
    if (testGuildID && this.guilds.cache.has(testGuildID)) {
      // Try to get the guild object
      const guild: Guild | undefined = this.guilds.cache.get(testGuildID);

      // If the guild is found
      if (guild) {
        // Fetch all commands for that guild
        const guildCommands: Collection<string, ApplicationCommand> =
          await guild.commands.fetch();

        // Put all those commands into a map
        const commandMap = new Map<
          string,
          { id: string; subcommands: Map<string, string> }
        >();

        // For every command
        guildCommands.forEach((command: ApplicationCommand): void => {
          const subMap = new Map<string, string>();

          // If a command has options
          if (command.options) {
            command.options.forEach(
              (option: ApplicationCommandOption): void => {
                // Check if the option is a subcommand
                if (option.type === ApplicationCommandOptionType.Subcommand) {
                  subMap.set(option.name, `${command.id}:${option.name}`);
                }
              },
            );
          }

          commandMap.set(command.name, { id: command.id, subcommands: subMap });
        });

        this.guildCommandIDCache.set(testGuildID, commandMap);
      }
    }
  }

  // Get command ID for a global command, or a guild command
  getCommandID(commandName: string, guildID?: string): string | undefined {
    // If the guild ID is provided, and if this guild had its commands cached
    if (guildID && this.guildCommandIDCache.has(guildID)) {
      // Get the command ID by command name and return
      return this.guildCommandIDCache.get(guildID)?.get(commandName)?.id;
    }

    // Otherwise, get the command ID from the global cache and return
    return this.globalCommandIDCache.get(commandName)?.id;
  }

  // Get subcommand ID for a global command, or a guild command
  getSubcommandID(
    commandName: string,
    subcommandName: string,
    guildID?: string,
  ): string | undefined {
    // If the guild ID is provided, and if this guild had its commands cached
    if (guildID && this.guildCommandIDCache.has(guildID)) {
      // Get the subcommand ID by command name and return
      return this.guildCommandIDCache
        .get(guildID)
        ?.get(commandName)
        ?.subcommands.get(subcommandName);
    }

    // Otherwise, get the subcommand ID from the global cache and return
    return this.globalCommandIDCache
      .get(commandName)
      ?.subcommands.get(subcommandName);
  }

  // Initialise the bot, load commands and events, then log in
  async init(): Promise<void> {
    try {
      // Load event listeners
      await loadEvents(this);

      // Load slash commands
      await loadSlashCommands(this);

      // Load context-menu commands
      await loadContextMenuCommands(this);

      // Load message commands
      await loadMessageCommands(this);

      // Log the bot into Discord using the token
      await this.login(env.BOT_TOKEN)
        .catch((err: unknown): never => {
          // Log the error and exit the process if the bot fails to log in
          logger.error(
            ELYSIAN_SPIRIT_CLIENT_MESSAGES.errorDuringClientInitialisation(err),
          );
          process.kill(process.ppid);
          process.exit(1);
        })
        .then((): void => {
          // Log the success message after successful login
          logger.info(ELYSIAN_SPIRIT_CLIENT_MESSAGES.SUCCESSFUL_LOGIN);
        });
    } catch (err) {
      // Log any initialisation error and exit the process
      logger.error(ELYSIAN_SPIRIT_CLIENT_MESSAGES.errorDuringClientLogin(err));
      process.kill(process.ppid);
      process.exit(1);
    }
  }
}
