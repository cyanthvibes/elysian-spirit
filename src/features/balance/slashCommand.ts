import { ElysianSpirit } from "classes/client.js";
import { SlashCommand } from "classes/slashCommand.js";
import { CHANNEL_KEYS } from "constants/channels.js";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandUserOption,
  User,
} from "discord.js";
import { handleBalanceInteraction } from "src/features/balance/handlers.js";
import { SlashCommandHandler } from "types/commandHandlers.js";
import { withSlashCommandErrorHandling } from "utils/commandUtils.js";

export default class BalanceSlashCommand extends SlashCommand {
  execute: SlashCommandHandler = withSlashCommandErrorHandling(
    async (
      client: ElysianSpirit,
      interaction: ChatInputCommandInteraction,
    ): Promise<void> => {
      // If no member was provided as an argument, use the member that used the command
      const targetMember: User =
        interaction.options.getUser("member") ?? interaction.user;

      await handleBalanceInteraction(interaction, targetMember);
    },
  );
  constructor() {
    super();
    this.data
      .setName("balance")
      .setDescription(
        "Get a balance of your clan points, or from another member",
      )
      .addUserOption(
        (option: SlashCommandUserOption): SlashCommandUserOption =>
          option
            .setName("member")
            .setDescription("Member to check balance for")
            .setRequired(false),
      );

    this.allowedChannelKeys = [CHANNEL_KEYS.BOT_CHANNEL];
  }

  async autocomplete(
    client: ElysianSpirit,
    interaction: AutocompleteInteraction,
  ): Promise<void> {
    await interaction.respond([]);
  }
}
