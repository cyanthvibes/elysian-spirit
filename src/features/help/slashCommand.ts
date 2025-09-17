import { ElysianSpirit } from "classes/client.js";
import { SlashCommand } from "classes/slashCommand.js";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandStringOption,
} from "discord.js";
import {
  handleHelpAutocomplete,
  handleHelpInteraction,
} from "src/features/help/handlers.js";
import {
  AutocompleteInteractionHandler,
  SlashCommandHandler,
} from "types/commandHandlers.js";
import {
  withAutocompleteInteractionHandling,
  withSlashCommandErrorHandling,
} from "utils/commandUtils.js";

export default class HelpCommand extends SlashCommand {
  autocomplete: AutocompleteInteractionHandler =
    withAutocompleteInteractionHandling(
      async (
        client: ElysianSpirit,
        interaction: AutocompleteInteraction,
      ): Promise<void> => {
        await handleHelpAutocomplete(client, interaction);
      },
    );

  execute: SlashCommandHandler = withSlashCommandErrorHandling(
    async (
      client: ElysianSpirit,
      interaction: ChatInputCommandInteraction,
    ): Promise<void> => {
      await handleHelpInteraction(client, interaction);
    },
  );

  constructor() {
    super();
    this.data
      .setName("help")
      .setDescription(
        "Shows available commands, or info about a specific command",
      )
      .addStringOption(
        (option: SlashCommandStringOption): SlashCommandStringOption =>
          option
            .setName("command")
            .setDescription("Get detailed help for a specific command")
            .setRequired(false)
            .setAutocomplete(true),
      );
  }
}
