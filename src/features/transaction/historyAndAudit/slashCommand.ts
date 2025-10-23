import { ElysianSpirit } from "classes/client.js";
import { SlashCommand } from "classes/slashCommand.js";
import { CHANNEL_KEYS } from "constants/channels.js";
import {
  DEFAULT_TRANSACTION_DAYS,
  DEFAULT_TRANSACTION_LIMIT,
  MAX_TRANSACTION_LIMIT,
} from "constants/clanPoints.js";
import { ROLE_KEYS } from "constants/roles.js";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandIntegerOption,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
  SlashCommandUserOption,
} from "discord.js";
import { handleTransactionHistoryOrAuditInteraction } from "src/features/transaction/historyAndAudit/handlers.js";
import { ActionType } from "src/generated/prisma/enums.js";
import { SlashCommandHandler } from "types/commandHandlers.js";
import { withSlashCommandErrorHandling } from "utils/commandUtils.js";

export default class TransactionsSlashCommand extends SlashCommand {
  execute: SlashCommandHandler = withSlashCommandErrorHandling(
    async (
      client: ElysianSpirit,
      interaction: ChatInputCommandInteraction,
    ): Promise<void> => {
      const subcommand: string = interaction.options.getSubcommand(true);

      if (subcommand === "audit") {
        await handleTransactionHistoryOrAuditInteraction(
          interaction,
          ActionType.AUDIT,
        );
      } else if (subcommand === "history") {
        await handleTransactionHistoryOrAuditInteraction(
          interaction,
          ActionType.HISTORY,
        );
      }
    },
  );

  constructor() {
    super();
    this.data
      .setName("transactions")
      .setDescription("View clan point transaction history")
      .addSubcommand(
        (
          subcommand: SlashCommandSubcommandBuilder,
        ): SlashCommandSubcommandBuilder =>
          subcommand
            .setName("history")
            .setDescription(
              `View clan point transaction history for a member (defaults to the last ${DEFAULT_TRANSACTION_DAYS} days)`,
            )
            .addUserOption(
              (option: SlashCommandUserOption): SlashCommandUserOption =>
                option
                  .setName("member")
                  .setDescription("Member to view history for")
                  .setRequired(true),
            )
            .addStringOption(
              (option: SlashCommandStringOption): SlashCommandStringOption =>
                option
                  .setName("from")
                  .setDescription("Start date")
                  .setRequired(false)
                  .setAutocomplete(false),
            )
            .addStringOption(
              (option: SlashCommandStringOption): SlashCommandStringOption =>
                option
                  .setName("to")
                  .setDescription("End date")
                  .setRequired(false)
                  .setAutocomplete(false),
            )
            .addIntegerOption(
              (option: SlashCommandIntegerOption): SlashCommandIntegerOption =>
                option
                  .setName("limit")
                  .setDescription(
                    `The maximum number of transactions to show (defaults to ${DEFAULT_TRANSACTION_LIMIT} transactions)`,
                  )
                  .setMinValue(1)
                  .setMaxValue(MAX_TRANSACTION_LIMIT)
                  .setRequired(false)
                  .setAutocomplete(false),
            ),
      )
      .addSubcommand(
        (
          subcommand: SlashCommandSubcommandBuilder,
        ): SlashCommandSubcommandBuilder =>
          subcommand
            .setName("audit")
            .setDescription(
              `View clan point transactions performed by a member (defaults to the last ${DEFAULT_TRANSACTION_DAYS} days)`,
            )
            .addUserOption(
              (option: SlashCommandUserOption): SlashCommandUserOption =>
                option
                  .setName("member")
                  .setDescription("Member to audit")
                  .setRequired(true),
            )
            .addStringOption(
              (option: SlashCommandStringOption): SlashCommandStringOption =>
                option
                  .setName("from")
                  .setDescription("Start date")
                  .setRequired(false)
                  .setAutocomplete(false),
            )
            .addStringOption(
              (option: SlashCommandStringOption): SlashCommandStringOption =>
                option
                  .setName("to")
                  .setDescription("End date")
                  .setRequired(false)
                  .setAutocomplete(false),
            )
            .addIntegerOption(
              (option: SlashCommandIntegerOption): SlashCommandIntegerOption =>
                option
                  .setName("limit")
                  .setDescription(
                    `The maximum number of transactions to show (defaults to ${DEFAULT_TRANSACTION_LIMIT} transactions)`,
                  )
                  .setMinValue(1)
                  .setMaxValue(MAX_TRANSACTION_LIMIT)
                  .setRequired(false)
                  .setAutocomplete(false),
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
