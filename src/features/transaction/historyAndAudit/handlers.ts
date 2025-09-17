import {
  DEFAULT_TRANSACTION_LIMIT,
  MAX_TRANSACTION_LIMIT,
} from "constants/clanPoints.js";
import { getClanPointsTransactions } from "database/repositories/clanPoints/transactionRepository.js";
import {
  ChatInputCommandInteraction,
  ContainerBuilder,
  MessageFlags,
  User,
} from "discord.js";
import { DateTime } from "luxon";
import { buildTransactionHistoryOrAuditContainers } from "src/features/transaction/historyAndAudit/messageBuilder.js";
import { TRANSACTION_MESSAGES } from "src/features/transaction/historyAndAudit/messages.js";
import { ActionType } from "src/generated/prisma/enums.js";
import { ContainerStyle } from "types/container.js";
import { createSimpleContainers } from "utils/containers/containersBuilder.js";
import { sendInteractionContainers } from "utils/containers/containersUtils.js";
import { resolveDateRange } from "utils/dateUtils.js";

interface TransactionDateRange {
  dateCapped: boolean;
  from: DateTime;
  to: DateTime;
}

// Function that handles /transactions audit and /transactions history
export async function handleTransactionHistoryOrAuditInteraction(
  interaction: ChatInputCommandInteraction,
  actionType: ActionType,
): Promise<void> {
  if (!interaction.guild) return;

  // Get arguments from interaction
  const targetMember: User = interaction.options.getUser("member", true);
  const fromString: string | undefined =
    interaction.options.getString("from") ?? undefined;
  const toString: string | undefined =
    interaction.options.getString("to") ?? undefined;
  const requestedLimit: number =
    interaction.options.getInteger("limit") ?? DEFAULT_TRANSACTION_LIMIT;

  // Either use the requested limit or cap at MAX_TRANSACTION_LIMIT
  const limit: number = Math.min(requestedLimit, MAX_TRANSACTION_LIMIT);

  // Store if the limit was capped or not
  const limitCapped: boolean = requestedLimit > limit;

  await interaction.reply({
    components: createSimpleContainers(
      ContainerStyle.INFO,
      TRANSACTION_MESSAGES.FIRST_REPLY_HEADER,
    ),
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });

  // Get a date range from the member provided arguments
  const { dateCapped, from, to }: TransactionDateRange = resolveDateRange(
    fromString,
    toString,
  );

  // Get targetMember and performer Discord ID
  const targetDiscordID: string | undefined =
    actionType === ActionType.HISTORY ? targetMember.id : undefined;
  const performedByDiscordID: string | undefined =
    actionType === ActionType.AUDIT ? targetMember.id : undefined;

  // For /transactions history, add ActionType.DAILY in the database lookup
  const includeDaily: boolean = actionType === ActionType.HISTORY;

  // Get all the transactions from the database
  const transactions: Awaited<ReturnType<typeof getClanPointsTransactions>> =
    await getClanPointsTransactions(
      interaction.guild,
      from,
      to,
      targetDiscordID,
      performedByDiscordID,
      includeDaily,
      limit,
    );

  const containers: ContainerBuilder[] =
    buildTransactionHistoryOrAuditContainers(
      dateCapped,
      from,
      limitCapped,
      targetMember,
      to,
      transactions,
    );

  await sendInteractionContainers(interaction, containers, false);
}
