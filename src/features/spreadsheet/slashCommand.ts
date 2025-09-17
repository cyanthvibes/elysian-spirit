import { ElysianSpirit } from "classes/client.js";
import { SlashCommand } from "classes/slashCommand.js";
import { ROLE_KEYS } from "constants/roles.js";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { handlePopulateSpreadsheetInteraction } from "src/features/spreadsheet/populate/handlers.js";
import { handleValidateSpreadsheetInteraction } from "src/features/spreadsheet/validate/handlers.js";
import { SlashCommandHandler } from "types/commandHandlers.js";
import { withSlashCommandErrorHandling } from "utils/commandUtils.js";

export default class SpreadsheetSlashCommand extends SlashCommand {
  execute: SlashCommandHandler = withSlashCommandErrorHandling(
    async (
      client: ElysianSpirit,
      interaction: ChatInputCommandInteraction,
    ): Promise<void> => {
      const subcommand: string = interaction.options.getSubcommand(true);

      if (subcommand === "populate") {
        await handlePopulateSpreadsheetInteraction(interaction);
      } else if (subcommand === "validate") {
        await handleValidateSpreadsheetInteraction(interaction);
      }
    },
  );
  constructor() {
    super(true);
    this.data
      .setName("spreadsheet")
      .setDescription("Validate or populate the spreadsheet")
      .addSubcommand(
        (
          subcommand: SlashCommandSubcommandBuilder,
        ): SlashCommandSubcommandBuilder =>
          subcommand
            .setName("populate")
            .setDescription("Populate the spreadsheet"),
      )
      .addSubcommand(
        (
          subcommand: SlashCommandSubcommandBuilder,
        ): SlashCommandSubcommandBuilder =>
          subcommand
            .setName("validate")
            .setDescription("Validate the spreadsheet"),
      );

    this.requiredRoleKeys = [ROLE_KEYS.CLAN_STAFF, ROLE_KEYS.MEMBER_PERMS];
    this.allowedChannelKeys = [];
  }

  async autocomplete(
    client: ElysianSpirit,
    interaction: AutocompleteInteraction,
  ): Promise<void> {
    await interaction.respond([]);
  }
}
