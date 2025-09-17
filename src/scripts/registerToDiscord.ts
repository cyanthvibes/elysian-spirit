import { ContextMenuCommand } from "classes/contextMenuCommand.js";
import { SlashCommand } from "classes/slashCommand.js";
import { env } from "config/envLoader.js";
import { REGISTER_COMMANDS_MESSAGES } from "constants/messages/registerCommandsMessages.js";
import {
  Collection,
  REST,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPIContextMenuApplicationCommandsJSONBody,
  Routes,
} from "discord.js";
import { loadContextMenuCommandsFromFiles } from "loaders/contextMenuCommandsLoader.js";
import { loadSlashCommandsFromFiles } from "loaders/slashCommandsLoader.js";
import { logger } from "utils/logger.js";

// Discord REST client
const rest: REST = new REST({ version: "10" }).setToken(env.BOT_TOKEN);

// Helper to build the command JSON body for registration
function buildCommandBody(
  slashCommands: Collection<string, SlashCommand>,
  contextMenuCommands: Collection<string, ContextMenuCommand>,
): (
  | RESTPostAPIChatInputApplicationCommandsJSONBody
  | RESTPostAPIContextMenuApplicationCommandsJSONBody
)[] {
  return [
    ...Array.from(slashCommands.values()).map((cmd: SlashCommand) =>
      cmd.data.toJSON(),
    ),
    ...Array.from(contextMenuCommands.values()).map((cmd: ContextMenuCommand) =>
      cmd.data.toJSON(),
    ),
  ];
}

// Clears all global commands
async function clearGlobalCommands(): Promise<void> {
  logger.info(REGISTER_COMMANDS_MESSAGES.CLEARING_GLOBAL_COMMANDS);
  try {
    await rest.put(Routes.applicationCommands(env.BOT_ID), {
      body: [],
    });
    logger.info(REGISTER_COMMANDS_MESSAGES.CLEARING_GLOBAL_COMMANDS_SUCCESSFUL);
  } catch (err) {
    logger.error(REGISTER_COMMANDS_MESSAGES.errorClearingGlobalCommands(err));
  }
}

// Clears all guild commands
async function clearGuildCommands(guildIDs: string[]): Promise<void> {
  for (const guildID of guildIDs) {
    logger.info(REGISTER_COMMANDS_MESSAGES.clearingGuildCommands(guildID));
    try {
      await rest.put(Routes.applicationGuildCommands(env.BOT_ID, guildID), {
        body: [],
      });
      logger.info(
        REGISTER_COMMANDS_MESSAGES.clearingGuildCommandsSuccessful(guildID),
      );
    } catch (err) {
      logger.error(
        REGISTER_COMMANDS_MESSAGES.errorClearingGuildCommands(guildID, err),
      );
    }
  }
}

// Register commands globally
async function registerGlobalCommands(
  slashCommands: Collection<string, SlashCommand>,
  contextMenuCommands: Collection<string, ContextMenuCommand>,
): Promise<void> {
  logger.info(REGISTER_COMMANDS_MESSAGES.REGISTERING_GLOBAL_COMMANDS);
  try {
    await rest.put(Routes.applicationCommands(env.BOT_ID), {
      body: buildCommandBody(slashCommands, contextMenuCommands),
    });
    logger.info(
      REGISTER_COMMANDS_MESSAGES.REGISTERING_GLOBAL_COMMANDS_SUCCESSFUL,
    );
  } catch (err) {
    logger.error(
      REGISTER_COMMANDS_MESSAGES.errorRegisteringGlobalCommands(err),
    );
  }
}

// Register commands to the test guild
async function registerGuildCommands(
  guildIDs: string[],
  slashCommands: Collection<string, SlashCommand>,
  contextMenuCommands: Collection<string, ContextMenuCommand>,
): Promise<void> {
  for (const guildID of guildIDs) {
    logger.info(REGISTER_COMMANDS_MESSAGES.registeringGuildCommands(guildID));
    try {
      await rest.put(Routes.applicationGuildCommands(env.BOT_ID, guildID), {
        body: buildCommandBody(slashCommands, contextMenuCommands),
      });
      logger.info(
        REGISTER_COMMANDS_MESSAGES.registeringGuildCommandsSuccessful(guildID),
      );
    } catch (err) {
      logger.error(
        REGISTER_COMMANDS_MESSAGES.errorRegisteringGuildCommands(guildID, err),
      );
    }
  }
}

// Main entry point to register or clear commands based on CLI args
async function registerToDiscord(): Promise<void> {
  const scope: string = process.argv[2];
  const action: string = process.argv[3];

  if (!scope || !["global", "guild"].includes(scope)) {
    logger.error(REGISTER_COMMANDS_MESSAGES.INVALID_FIRST_ARGUMENT);
    process.exit(1);
  }

  // Load commands regardless of action (register or clear)
  const slashCommands: Collection<string, SlashCommand> =
    await loadSlashCommandsFromFiles();
  const contextMenuCommands: Collection<string, ContextMenuCommand> =
    await loadContextMenuCommandsFromFiles();

  if (scope === "guild") {
    const testGuildID: string | undefined =
      process.env.TEST_GUILD_ID || env.TEST_GUILD_ID;

    if (!testGuildID) {
      logger.error(REGISTER_COMMANDS_MESSAGES.TEST_GUILD_ID_MISSING);
      process.exit(1);
    }

    const guildIDs: string[] = [testGuildID];

    if (action === "clear") {
      await clearGuildCommands(guildIDs);
    } else {
      await registerGuildCommands(guildIDs, slashCommands, contextMenuCommands);
    }
  } else if (scope === "global") {
    if (action === "clear") {
      await clearGlobalCommands();
    } else {
      await registerGlobalCommands(slashCommands, contextMenuCommands);
    }
  } else {
    logger.error(REGISTER_COMMANDS_MESSAGES.INVALID_SECOND_ARGUMENT);
    process.exit(1);
  }
}

// Immediately run the registration
(async (): Promise<void> => {
  try {
    await registerToDiscord();
  } catch (err) {
    logger.error(REGISTER_COMMANDS_MESSAGES.errorDuringRegistration(err));
    process.exit(1);
  }
})();
