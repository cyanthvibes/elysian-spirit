import { MESSAGE_COLOURS } from "constants/colours.js";
import { createTransactionIDLine } from "constants/strings.js";
import {
  ChatInputCommandInteraction,
  ContainerBuilder,
  Message,
  MessageFlags,
} from "discord.js";
import {
  ContainerStyle,
  MessageBlock,
  MessageChunkType,
} from "types/container.js";

export function createContentBlock(
  content: string[],
  header?: string,
): MessageBlock {
  return {
    content,
    header: header,
    type: MessageChunkType.CONTENT_BLOCK,
  };
}

export function createFooterBlock(transactionID: string): MessageBlock {
  return {
    type: MessageChunkType.FOOTER_BLOCK,
    value: createTransactionIDLine(transactionID),
  };
}

export function createMainHeader(value: string): MessageBlock {
  return {
    type: MessageChunkType.MAIN_HEADER_BLOCK,
    value,
  };
}

// Helper function that returns the hex-code for colours
export function getColorForStyle(style: ContainerStyle): number {
  switch (style) {
    case ContainerStyle.ERROR:
      return MESSAGE_COLOURS.ERROR;
    case ContainerStyle.SUCCESS:
      return MESSAGE_COLOURS.SUCCESS;
    default:
      return MESSAGE_COLOURS.INFO;
  }
}

// Sends an array of containers and automatically chooses editReply() or followUp()
export async function sendInteractionContainers(
  interaction: ChatInputCommandInteraction,
  containers: ContainerBuilder[],
  mention: boolean,
): Promise<void> {
  let flags;

  // Set appropriate message flags
  if (interaction.ephemeral) {
    flags = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;
  } else {
    flags = MessageFlags.IsComponentsV2;
  }

  // Return early if there were no containers provided
  if (containers.length === 0) return;

  // The first container uses editReply()
  await interaction.editReply({
    ...(mention
      ? { allowedMentions: { parse: ["users"] } }
      : { allowedMentions: { parse: [] } }),
    components: [containers[0]],
    flags,
  });

  // All containers after the first one use followUp()
  for (let i = 1; i < containers.length; i++) {
    await interaction.followUp({
      ...(mention
        ? { allowedMentions: { parse: ["users"] } }
        : { allowedMentions: { parse: [] } }),
      components: [containers[i]],
      flags,
    });
  }
}

// Sends an array of containers, but for messages instead of interactions
export async function sendMessageContainers(
  message: Message,
  containers: ContainerBuilder[],
  mention: boolean,
): Promise<void> {
  // Return early if no containers were provided
  if (containers.length === 0) return;

  // The first container uses reply()
  let lastMessage = await message.reply({
    ...(mention
      ? { allowedMentions: { parse: ["users"] } }
      : { allowedMentions: { parse: [] } }),
    components: [containers[0]],
    flags: MessageFlags.IsComponentsV2,
  });

  // ALl containers after the first one use reply(), but on the previous message
  for (let i = 1; i < containers.length; i++) {
    lastMessage = await lastMessage.reply({
      ...(mention
        ? { allowedMentions: { parse: ["users"] } }
        : { allowedMentions: { parse: [] } }),
      components: [containers[i]],
      flags: MessageFlags.IsComponentsV2,
    });
  }
}
