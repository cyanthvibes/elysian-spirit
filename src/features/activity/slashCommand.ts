import { ElysianSpirit } from "classes/client.js";
import { SlashCommand } from "classes/slashCommand.js";
import { CHANNEL_KEYS } from "constants/channels.js";
import { ROLE_KEYS } from "constants/roles.js";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandIntegerOption,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { DEFAULT_INACTIVITY_DAYS } from "src/features/activity/constants.js";
import { handleInactivityInteraction } from "src/features/activity/handlers.js";
import { SlashCommandHandler } from "types/commandHandlers.js";
import { withSlashCommandErrorHandling } from "utils/commandUtils.js";

export default class InactivitySlashCommand extends SlashCommand {
  execute: SlashCommandHandler = withSlashCommandErrorHandling(
    async (
      client: ElysianSpirit,
      interaction: ChatInputCommandInteraction,
    ): Promise<void> => {
      await handleInactivityInteraction(interaction);
    },
  );

  constructor() {
    super();
    this.data
      .setName("inactivity")
      .setDescription("Check for inactivity ")
      .addSubcommand(
        (
          subcommand: SlashCommandSubcommandBuilder,
        ): SlashCommandSubcommandBuilder =>
          subcommand
            .setName("check")
            .setDescription("Check for inactivity")
            .addIntegerOption(
              (option: SlashCommandIntegerOption): SlashCommandIntegerOption =>
                option
                  .setName("days")
                  .setDescription(
                    `Number of days to consider as inactive (defaults to ${DEFAULT_INACTIVITY_DAYS} days)`,
                  )
                  .setMinValue(1),
            ),
      )
      .addSubcommand(
        (
          subcommand: SlashCommandSubcommandBuilder,
        ): SlashCommandSubcommandBuilder =>
          subcommand
            .setName("de-rank")
            .setDescription("Make members guests")
            .addIntegerOption(
              (option: SlashCommandIntegerOption): SlashCommandIntegerOption =>
                option
                  .setName("days")
                  .setDescription(
                    `Number of days to consider as inactive (defaults to ${DEFAULT_INACTIVITY_DAYS} days)`,
                  )
                  .setMinValue(1),
            )
            .addStringOption(
              (option: SlashCommandStringOption): SlashCommandStringOption =>
                option
                  .setName("members")
                  .setDescription(
                    "List of members (mention them). All inactive members will be de-ranked.",
                  ),
            ),
      );

    this.requiredRoleKeys = [ROLE_KEYS.CLAN_STAFF, ROLE_KEYS.MEMBER_PERMS];
    this.allowedChannelKeys = [CHANNEL_KEYS.BOT_CHANNEL];
  }

  async autocomplete(
    client: ElysianSpirit,
    interaction: AutocompleteInteraction,
  ): Promise<void> {
    await interaction.respond([]);
  }
}
