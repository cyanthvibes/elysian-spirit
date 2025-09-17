import { getConfig, GuildConfig } from "config/configLoader.js";
import {
  ChatInputCommandInteraction,
  ContainerBuilder,
  GuildMember,
  MessageFlags,
} from "discord.js";
import { createRange, getGoogleSheets } from "src/features/spreadsheet/API.js";
import { buildPopulateSpreadsheetContainers } from "src/features/spreadsheet/populate/messageBuilder.js";
import { POPULATE_MESSAGES } from "src/features/spreadsheet/populate/messages.js";
import {
  PopulationSummary,
  SpreadsheetRow,
  SpreadsheetValidationResult,
  ValidatedRow,
} from "src/features/spreadsheet/types.js";
import { readSpreadsheetData } from "src/features/spreadsheet/utils.js";
import { validateSpreadsheet } from "src/features/spreadsheet/validator.js";
import { ContainerStyle } from "types/container.js";
import { createSimpleContainers } from "utils/containers/containersBuilder.js";
import { sendInteractionContainers } from "utils/containers/containersUtils.js";

export async function handlePopulateSpreadsheetInteraction(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!interaction.guild) return;

  await interaction.reply({
    components: createSimpleContainers(
      ContainerStyle.INFO,
      POPULATE_MESSAGES.FIRST_REPLY_HEADER,
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

  // Populate Discord IDs wherever possible
  if (validationResult.populatableRows.length > 0) {
    const { updateValues } = await getGoogleSheets(interaction.guild.id);
    const guildConfig: GuildConfig = getConfig().GUILDS[interaction.guild.id];
    const { DISCORD_ID } = guildConfig.SPREADSHEET_COLUMNS;
    const sheetName: string = guildConfig.SPREADSHEET_SHEET;

    const dataToUpdate: string[][] = [];
    const startRow: number = validationResult.populatableRows[0].row.row;
    const endRow: number =
      validationResult.populatableRows[
        validationResult.populatableRows.length - 1
      ].row.row;

    // Create an array with all the rows
    for (let i = startRow; i <= endRow; i++) {
      const populatableRow: undefined | ValidatedRow =
        validationResult.populatableRows.find(
          (row: ValidatedRow): boolean => row.row.row === i,
        );

      dataToUpdate.push([populatableRow?.expectedDiscordID || ""]);
    }

    // Create range for Discord ID column
    const range: string = createRange(
      DISCORD_ID,
      startRow,
      DISCORD_ID,
      sheetName,
      endRow,
    );

    // Batch-update the spreadsheet
    await updateValues(range, dataToUpdate);
  }

  // Build the population summary
  const summary: PopulationSummary = {
    errorsByRow: validationResult.errorsByRow,
    populatedCount: validationResult.populatableRows.length,
    totalRows: rows.length,
  };

  const containers: ContainerBuilder[] =
    buildPopulateSpreadsheetContainers(summary);

  await sendInteractionContainers(interaction, containers, false);
}
