import { ElysianSpirit } from "classes/client.js";
import { SlashCommand } from "classes/slashCommand.js";
import { CHANNEL_KEYS } from "constants/channels.js";
import { ROLE_KEYS } from "constants/roles.js";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from "discord.js";
import { handleDailyInteraction } from "src/features/daily/handlers.js";
import { SlashCommandHandler } from "types/commandHandlers.js";
import { withSlashCommandErrorHandling } from "utils/commandUtils.js";

export default class ClaimDailyClanPointsSlashCommand extends SlashCommand {
  execute: SlashCommandHandler = withSlashCommandErrorHandling(
    async (
      client: ElysianSpirit,
      interaction: ChatInputCommandInteraction,
    ): Promise<void> => {
      await handleDailyInteraction(interaction);
    },
  );

  constructor() {
    super();
    this.data.setName("daily").setDescription("Claim your daily clan points");

    this.allowedChannelKeys = [CHANNEL_KEYS.BOT_CHANNEL];
    this.requiredRoleKeys = [ROLE_KEYS.MEMBER_PERMS];
  }

  async autocomplete(
    client: ElysianSpirit,
    interaction: AutocompleteInteraction,
  ): Promise<void> {
    await interaction.respond([]);
  }
}
