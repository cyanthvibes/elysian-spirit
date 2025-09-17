import { ElysianSpirit } from "classes/client.js";
import { SlashCommand } from "classes/slashCommand.js";
import { CHANNEL_KEYS } from "constants/channels.js";
import { ROLE_KEYS } from "constants/roles.js";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandStringOption,
} from "discord.js";
import { handleUndoInteraction } from "src/features/transaction/undo/handlers.js";
import { SlashCommandHandler } from "types/commandHandlers.js";
import { withSlashCommandErrorHandling } from "utils/commandUtils.js";

export default class UndoTransactionCommand extends SlashCommand {
  execute: SlashCommandHandler = withSlashCommandErrorHandling(
    async (
      client: ElysianSpirit,
      interaction: ChatInputCommandInteraction,
    ): Promise<void> => {
      await handleUndoInteraction(interaction);
    },
  );

  constructor() {
    super();
    this.data
      .setName("undo")
      .setDescription("Undo a transaction")
      .addStringOption(
        (option: SlashCommandStringOption): SlashCommandStringOption =>
          option
            .setName("transaction_id")
            .setDescription("Transaction ID to undo")
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
