import { undoTransaction } from "database/repositories/clanPoints/transactionRepository.js";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { buildUndoContainers } from "src/features/transaction/undo/messageBuilder.js";

// Function that handles /undo
export async function handleUndoInteraction(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!interaction.guild) return;

  // Get argument from interaction
  const targetTransactionID: string = interaction.options.getString(
    "transaction_id",
    true,
  );

  // Undo the transaction
  const result: string = await undoTransaction(
    interaction.guild,
    targetTransactionID,
    interaction.user.id,
  );

  await interaction.reply({
    components: buildUndoContainers(result),
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
  });
}
