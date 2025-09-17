import { ElysianSpirit } from "classes/client.js";
import { SlashCommand } from "classes/slashCommand.js";
import { CHANNEL_KEYS } from "constants/channels.js";
import { ROLE_KEYS } from "constants/roles.js";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandIntegerOption,
  SlashCommandNumberOption,
} from "discord.js";
import { handleTempleInteraction } from "src/features/temple/handlers.js";
import { SlashCommandHandler } from "types/commandHandlers.js";
import { withSlashCommandErrorHandling } from "utils/commandUtils.js";

export default class TempleSlashCommand extends SlashCommand {
  execute: SlashCommandHandler = withSlashCommandErrorHandling(
    async (
      client: ElysianSpirit,
      interaction: ChatInputCommandInteraction,
    ): Promise<void> => {
      await handleTempleInteraction(interaction);
    },
  );

  constructor() {
    super();
    this.data
      .setName("temple")
      .setDescription("Award clan points based on a TempleOSRS competition")
      .addIntegerOption(
        (option: SlashCommandIntegerOption): SlashCommandIntegerOption =>
          option
            .setName("competition_id")
            .setDescription("TempleOSRS competition ID")
            .setRequired(true),
      )
      .addNumberOption(
        (option: SlashCommandNumberOption): SlashCommandNumberOption =>
          option
            .setName("gain_per_clan_point")
            .setDescription("Gain (XP or KC) required for 1 clan point")
            .setMinValue(0)
            .setRequired(true),
      )
      .addIntegerOption(
        (option: SlashCommandIntegerOption): SlashCommandIntegerOption =>
          option
            .setName("max_clan_points")
            .setDescription("Maximum clan points any single user can receive")
            .setRequired(true),
      )
      .addIntegerOption(
        (option: SlashCommandIntegerOption): SlashCommandIntegerOption =>
          option
            .setName("first_place_cap")
            .setDescription("Maximum clan points for 1st place")
            .setRequired(true),
      )
      .addIntegerOption(
        (option: SlashCommandIntegerOption): SlashCommandIntegerOption =>
          option
            .setName("second_place_cap")
            .setDescription("Maximum clan points for 2nd place")
            .setRequired(true),
      )
      .addIntegerOption(
        (option: SlashCommandIntegerOption): SlashCommandIntegerOption =>
          option
            .setName("third_place_cap")
            .setDescription("Maximum clan points for 3rd place")
            .setRequired(true),
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
