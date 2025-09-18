import { ElysianSpirit } from "classes/client.js";
import { Event } from "classes/event.js";
import { reportConfigValidation, validateConfig } from "config/configUtils.js";
import {
  reportGoogleCredentialsValidation,
  validateGoogleCredentials,
} from "config/googleCredentialsUtils.js";
import { ELYSIAN_SPIRIT_CLIENT_MESSAGES } from "constants/messages/elysianSpiritClientMessages.js";
import { FETCHING_TIMEOUT } from "constants/ready.js";
import { getAllGuilds } from "database/repositories/guilds/guildRepository.js";
import { Events } from "discord.js";
import { Guild } from "src/generated/prisma/client.js";
import { ConfigValidationReport } from "types/configValidation.js";
import { GoogleCredentialsReport } from "types/googleCredentialsValidation.js";
import { logger } from "utils/logger.js";
import { startPresence } from "utils/readyUtils.js";

// Once the Discord bot is logged in, this event gets fired
export default class ClientReadyEvent extends Event<Events.ClientReady> {
  constructor() {
    super(Events.ClientReady, true);
  }

  async execute(client: ElysianSpirit): Promise<void> {
    logger.info(ELYSIAN_SPIRIT_CLIENT_MESSAGES.botReady(client.user?.tag));

    // Validate config.json
    const configErrorsByGuild: Record<string, string[]> =
      validateConfig(client);
    const configResults: ConfigValidationReport = reportConfigValidation(
      configErrorsByGuild,
      "validate",
    );

    if (configResults.hasErrors) {
      logger.error(configResults.message);
    } else {
      logger.info(configResults.message);
    }

    // Validate Google credentials for every guild
    const googleCredentialsErrorsByGuild: Record<string, string[]> =
      await validateGoogleCredentials();
    const googleCredentialsResults: GoogleCredentialsReport =
      reportGoogleCredentialsValidation(
        googleCredentialsErrorsByGuild,
        "validate",
      );

    if (googleCredentialsResults.hasErrors) {
      logger.error(googleCredentialsResults.message);
    } else {
      logger.info(googleCredentialsResults.message);
    }

    // Start presence interval
    await startPresence(client);

    // After the bot is ready, cache all command IDs for global commands, and guild commands for the test server
    await client.cacheAllCommandIDs();

    // Get all guilds from the database
    const allGuilds: Guild[] = await getAllGuilds();

    // Cache if commands are disabled for all guilds
    for (const guild of allGuilds) {
      client.guildCommandsEnabledStateCache.set(
        guild.guildID,
        guild.commandsEnabled,
      );
    }

    // Fetch all members to fill the cache
    for (const [guildID, guild] of client.guilds.cache) {
      try {
        logger.info(
          ELYSIAN_SPIRIT_CLIENT_MESSAGES.fetchingGuildMembers(
            guild.name,
            guildID,
          ),
        );

        await guild.members.fetch({ time: FETCHING_TIMEOUT });

        logger.info(
          ELYSIAN_SPIRIT_CLIENT_MESSAGES.fetchedMembers(guild.name, guildID),
        );
      } catch (err) {
        logger.error(
          ELYSIAN_SPIRIT_CLIENT_MESSAGES.errorFetchingMembers(
            guild.name,
            guildID,
            err,
          ),
        );
      }
    }
  }
}
