import {
  ChatInputCommandInteraction,
  ContainerBuilder,
  GuildMember,
  MessageFlags,
} from "discord.js";
import {
  SpreadsheetRow,
  SpreadsheetValidationResult,
} from "src/features/spreadsheet/types.js";
import { readSpreadsheetData } from "src/features/spreadsheet/utils.js";
import { buildValidateSpreadsheetContainers } from "src/features/spreadsheet/validate/messageBuilder.js";
import { SPREADSHEET_MESSAGES } from "src/features/spreadsheet/validate/messages.js";
import { validateSpreadsheet } from "src/features/spreadsheet/validator.js";
import { ContainerStyle } from "types/container.js";
import { createSimpleContainers } from "utils/containers/containersBuilder.js";
import { sendInteractionContainers } from "utils/containers/containersUtils.js";

export async function handleValidateSpreadsheetInteraction(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!interaction.guild) return;

  await interaction.reply({
    components: createSimpleContainers(
      ContainerStyle.INFO,
      SPREADSHEET_MESSAGES.FIRST_REPLY_HEADER,
    ),
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });

  // Get all the rows from the spreadsheet for the guild
  const rows: SpreadsheetRow[] = await readSpreadsheetData(
    interaction.guild.id,
  );

  // Get all the guild members (excluding bots)
  const members: GuildMember[] = Array.from(
    interaction.guild.members.cache.values(),
  ).filter((member: GuildMember): boolean => !member.user.bot);

  // Validate the spreadsheet
  const validationResult: SpreadsheetValidationResult = validateSpreadsheet(
    rows,
    members,
  );

  const containers: ContainerBuilder[] = buildValidateSpreadsheetContainers(
    validationResult,
    rows.length,
  );

  await sendInteractionContainers(interaction, containers, true);
}
