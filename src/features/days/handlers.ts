import { getGuildConfig } from "config/configUtils.js";
import {
  ChatInputCommandInteraction,
  MessageFlags,
  User,
  UserContextMenuCommandInteraction,
} from "discord.js";
import { DAYS_MESSAGES } from "src/features/days/messages.js";
import { SpreadsheetRow } from "src/features/spreadsheet/types.js";
import { readSpreadsheetData } from "src/features/spreadsheet/utils.js";
import { ContainerStyle } from "types/container.js";
import { createSimpleContainers } from "utils/containers/containersBuilder.js";

// Function that handles /days
export async function handleDaysInteraction(
  interaction: ChatInputCommandInteraction | UserContextMenuCommandInteraction,
  targetMember: User,
): Promise<void> {
  if (!interaction.guild) return;

  // If this feature is not implemented in this guild, return early
  if (!getGuildConfig(interaction.guild.id).SPREADSHEET_COLUMNS.DAYS) {
    let flags;

    // If the command was not used in the bot channel
    if (
      interaction.channel &&
      interaction.guild &&
      interaction.channel.id !==
        getGuildConfig(interaction.guild.id).CHANNEL_IDS.BOT_CHANNEL
    ) {
      // The response will be ephemeral
      flags = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;

      // Otherwise, the response will be public
    } else {
      flags = MessageFlags.IsComponentsV2;
    }

    await interaction.reply({
      components: createSimpleContainers(
        ContainerStyle.INFO,
        DAYS_MESSAGES.NOT_ENABLED,
      ),
      flags,
    });

    return;
  }

  // If the target member is a bot, respond immediately
  if (targetMember.bot) {
    await interaction.reply({
      components: createSimpleContainers(
        ContainerStyle.ERROR,
        DAYS_MESSAGES.BOTS_NO_DAYS,
      ),
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });

    // Otherwise, continue
  } else {
    // Check if the member who used the command is the target member
    const isSelf: boolean = targetMember.id === interaction.user.id;

    // Set the label for the message accordingly
    const label: string = DAYS_MESSAGES.label(isSelf, targetMember.id);

    // If used on themselves
    if (isSelf) {
      let flags;

      // If the command was not used in the bot channel
      if (
        interaction.channel &&
        interaction.guild &&
        interaction.channel.id !==
          getGuildConfig(interaction.guild.id).CHANNEL_IDS.BOT_CHANNEL
      ) {
        // The response will be ephemeral
        flags = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;

        // Otherwise, the response will be public
      } else {
        flags = MessageFlags.IsComponentsV2;
      }

      await interaction.reply({
        components: createSimpleContainers(
          ContainerStyle.INFO,
          DAYS_MESSAGES.gettingDays(label),
        ),
        flags,
      });

      // If used on someone else
    } else {
      await interaction.reply({
        components: createSimpleContainers(
          ContainerStyle.INFO,
          DAYS_MESSAGES.gettingDays(label),
        ),
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    // Read spreadsheet data
    const rows: SpreadsheetRow[] = await readSpreadsheetData(
      interaction.guild.id,
    );

    const memberRow: SpreadsheetRow | undefined = rows.find(
      (row: SpreadsheetRow): boolean => row.discordID === targetMember.id,
    );

    // Get the number of days for the target member
    const daysFromSpreadsheet: number | undefined = memberRow?.days;

    const message: string =
      daysFromSpreadsheet !== undefined
        ? DAYS_MESSAGES.days(label, daysFromSpreadsheet)
        : DAYS_MESSAGES.daysNotFound(label);

    await interaction.editReply({
      allowedMentions: { parse: [] },
      components: createSimpleContainers(ContainerStyle.SUCCESS, message),
      flags: MessageFlags.IsComponentsV2,
    });
  }
}
