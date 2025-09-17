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
import { handleAddOrRemoveInteraction } from "src/features/addOrRemove/handlers.js";
import { ActionType } from "src/generated/prisma/enums.js";
import { SlashCommandHandler } from "types/commandHandlers.js";
import { withSlashCommandErrorHandling } from "utils/commandUtils.js";

export default class AddOrRemoveSlashCommand extends SlashCommand {
  execute: SlashCommandHandler = withSlashCommandErrorHandling(
    async (
      client: ElysianSpirit,
      interaction: ChatInputCommandInteraction,
    ): Promise<void> => {
      const subcommand: string = interaction.options.getSubcommand(true);

      if (subcommand === "add") {
        await handleAddOrRemoveInteraction(interaction, ActionType.ADD);
      } else if (subcommand === "remove") {
        await handleAddOrRemoveInteraction(interaction, ActionType.REMOVE);
      }
    },
  );

  constructor() {
    super();
    this.data
      .setName("clan-points")
      .setDescription("Add or remove clan points")
      .addSubcommand(
        (
          subcommand: SlashCommandSubcommandBuilder,
        ): SlashCommandSubcommandBuilder =>
          subcommand
            .setName("add")
            .setDescription("Add clan points to a member or members")
            .addIntegerOption(
              (option: SlashCommandIntegerOption): SlashCommandIntegerOption =>
                option
                  .setName("amount")
                  .setDescription("Amount of clan points to add")
                  .setMinValue(1)
                  .setRequired(true),
            )
            .addStringOption(
              (option: SlashCommandStringOption): SlashCommandStringOption =>
                option
                  .setName("members")
                  .setDescription("List of members (mention them)")
                  .setRequired(true),
            )
            .addStringOption(
              (option: SlashCommandStringOption): SlashCommandStringOption =>
                option
                  .setName("reason")
                  .setDescription("Reason for adding clan points"),
            ),
      )
      .addSubcommand(
        (
          subcommand: SlashCommandSubcommandBuilder,
        ): SlashCommandSubcommandBuilder =>
          subcommand
            .setName("remove")
            .setDescription("Remove clan points from a member or members")
            .addIntegerOption(
              (option: SlashCommandIntegerOption): SlashCommandIntegerOption =>
                option
                  .setName("amount")
                  .setDescription("Amount of clan points to remove")
                  .setMinValue(1)
                  .setRequired(true),
            )
            .addStringOption(
              (option: SlashCommandStringOption): SlashCommandStringOption =>
                option
                  .setName("members")
                  .setDescription("List of members (mention them)")
                  .setRequired(true),
            )
            .addStringOption(
              (option: SlashCommandStringOption): SlashCommandStringOption =>
                option
                  .setName("reason")
                  .setDescription("Reason for removing clan points"),
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
