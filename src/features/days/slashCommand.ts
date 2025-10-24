import { ElysianSpirit } from "classes/client.js";
import { SlashCommand } from "classes/slashCommand.js";
import { CHANNEL_KEYS } from "constants/channels.js";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandUserOption,
  User,
} from "discord.js";
import { handleDaysInteraction } from "src/features/days/handlers.js";
import { SlashCommandHandler } from "types/commandHandlers.js";
import { withSlashCommandErrorHandling } from "utils/commandUtils.js";

export default class DaysSlashCommand extends SlashCommand {
  execute: SlashCommandHandler = withSlashCommandErrorHandling(
    async (
      client: ElysianSpirit,
      interaction: ChatInputCommandInteraction,
    ): Promise<void> => {
      // If no member was provided as an argument, use the member that used the command
      const targetMember: User =
        interaction.options.getUser("member") ?? interaction.user;

      await handleDaysInteraction(interaction, targetMember);
    },
  );

  constructor() {
    super();
    this.data
      .setName("days")
      .setDescription(
        "Check how long you, or another member, have been in the clan",
      )
      .addUserOption(
        (option: SlashCommandUserOption): SlashCommandUserOption =>
          option
            .setName("member")
            .setDescription(
              "Member to check the number of days in the clan for",
            )
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
