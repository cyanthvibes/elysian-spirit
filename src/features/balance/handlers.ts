import { getGuildConfig } from "config/configUtils.js";
import { getClanPoints } from "database/repositories/members/memberRepository.js";
import {
  ChatInputCommandInteraction,
  MessageFlags,
  User,
  UserContextMenuCommandInteraction,
} from "discord.js";
import { BALANCE_MESSAGES } from "src/features/balance/messages.js";
import { ContainerStyle } from "types/container.js";
import { createSimpleContainers } from "utils/containers/containersBuilder.js";

// Function that handles /balance
export async function handleBalanceInteraction(
  interaction: ChatInputCommandInteraction | UserContextMenuCommandInteraction,
  targetMember: User,
): Promise<void> {
  if (!interaction.guild) return;

  // If the target member is a bot, respond immediately
  if (targetMember.bot) {
    await interaction.reply({
      components: createSimpleContainers(
        ContainerStyle.ERROR,
        BALANCE_MESSAGES.BOTS_NO_CLAN_POINTS,
      ),
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });

    // Otherwise, continue
  } else {
    // Check if the member who used the command is the target member
    const isSelf: boolean = targetMember.id === interaction.user.id;

    // Set the label for the message accordingly
    const label: string = BALANCE_MESSAGES.label(isSelf, targetMember.id);

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
      } else {
        // Otherwise, the response will be public
        flags = MessageFlags.IsComponentsV2;
      }

      await interaction.reply({
        components: createSimpleContainers(
          ContainerStyle.INFO,
          BALANCE_MESSAGES.gettingBalance(label),
        ),
        flags,
      });

      // If used on someone else
    } else {
      await interaction.reply({
        components: createSimpleContainers(
          ContainerStyle.INFO,
          BALANCE_MESSAGES.gettingBalance(label),
        ),
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    // Get balance for the target member
    const balance: number = await getClanPoints(
      interaction.guild,
      targetMember.id,
    );

    await interaction.editReply({
      allowedMentions: { parse: [] },
      components: createSimpleContainers(
        ContainerStyle.SUCCESS,
        BALANCE_MESSAGES.balance(label, balance),
      ),
      flags: MessageFlags.IsComponentsV2,
    });
  }
}
