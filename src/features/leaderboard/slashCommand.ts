import { ElysianSpirit } from "classes/client.js";
import { SlashCommand } from "classes/slashCommand.js";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { handleClanPointsLeaderboardInteraction } from "src/features/leaderboard/handlers.js";
import { SlashCommandHandler } from "types/commandHandlers.js";
import { withSlashCommandErrorHandling } from "utils/commandUtils.js";

export default class LeaderboardSlashCommand extends SlashCommand {
  execute: SlashCommandHandler = withSlashCommandErrorHandling(
    async (
      client: ElysianSpirit,
      interaction: ChatInputCommandInteraction,
    ): Promise<void> => {
      const subcommand: string = interaction.options.getSubcommand(true);

      if (subcommand === "clan-points") {
        await handleClanPointsLeaderboardInteraction(interaction);
      }
    },
  );

  constructor() {
    super();
    this.data
      .setName("leaderboard")
      .setDescription("View leaderboards")
      .addSubcommand(
        (
          subcommand: SlashCommandSubcommandBuilder,
        ): SlashCommandSubcommandBuilder =>
          subcommand
            .setName("clan-points")
            .setDescription("View clan points leaderboards")
            .addStringOption(
              (option: SlashCommandStringOption): SlashCommandStringOption =>
                option
                  .setName("period")
                  .setDescription("Leaderboard period")
                  .addChoices(
                    { name: "All-time", value: "all-time" },
                    { name: "Yearly", value: "yearly" },
                    { name: "Monthly", value: "monthly" },
                  )
                  .setRequired(true)
                  .setAutocomplete(false),
            ),
      );
  }

  async autocomplete(
    client: ElysianSpirit,
    interaction: AutocompleteInteraction,
  ): Promise<void> {
    await interaction.respond([]);
  }
}
