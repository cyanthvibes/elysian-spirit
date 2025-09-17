import { ERROR_MESSAGES } from "constants/messages/errorMessages.js";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  Message,
  MessageContextMenuCommandInteraction,
  MessageFlags,
} from "discord.js";
import { ContainerStyle } from "types/container.js";
import { createSimpleContainers } from "utils/containers/containersBuilder.js";
import { logger } from "utils/logger.js";

// Ephemeral errors only get shown as an ephemeral message
export class EphemeralError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EphemeralError";
  }
}

// Public errors are sent as regular messages
export class PublicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicError";
  }
}

// Silent errors will be logged but not shown to members
export class SilentError extends Error {}

// Function that handles autocomplete interaction errors
export async function handleAutocompleteInteractionError(
  err: unknown,
  interaction: AutocompleteInteraction,
): Promise<void> {
  logger.error(
    ERROR_MESSAGES.unexpectedAutocompleteInteractionError(err, interaction),
  );
}

// Function that handles errors for interactions
export async function handleInteractionError(
  err: unknown,
  interaction:
    | ChatInputCommandInteraction
    | ContextMenuCommandInteraction
    | MessageContextMenuCommandInteraction,
): Promise<void> {
  try {
    // For ephemeral errors
    if (err instanceof EphemeralError) {
      // Defer if possible
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      }

      // If the interaction has not been replied to but is deferred, edit reply
      if (!interaction.replied) {
        // Send error
        await interaction.editReply({
          allowedMentions: { parse: [] },
          components: createSimpleContainers(ContainerStyle.ERROR, err.message),
          flags: MessageFlags.IsComponentsV2,
        });

        // Otherwise, edit reply
      } else if (interaction.replied) {
        // Send error
        await interaction.reply({
          allowedMentions: { parse: [] },
          components: createSimpleContainers(ContainerStyle.ERROR, err.message),
          flags: MessageFlags.IsComponentsV2,
        });
      }

      // For public errors
    } else if (err instanceof PublicError) {
      // Defer if possible
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
      }

      // If the interaction has not been replied to but is deferred, edit reply
      if (!interaction.replied) {
        // Send error
        await interaction.reply({
          allowedMentions: { parse: [] },
          components: createSimpleContainers(ContainerStyle.ERROR, err.message),
          flags: MessageFlags.IsComponentsV2,
        });

        // Otherwise, edit reply
      } else if (interaction.replied) {
        // Send error
        await interaction.editReply({
          allowedMentions: { parse: [] },
          components: createSimpleContainers(ContainerStyle.ERROR, err.message),
          flags: MessageFlags.IsComponentsV2,
        });
      }
    } else {
      // For all other errors
      logger.error(ERROR_MESSAGES.unexpectedError(err));

      // Defer if possible
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      }

      // If the interaction has not been replied to but is deferred, edit reply
      if (!interaction.replied) {
        // Send error
        await interaction.reply({
          allowedMentions: { parse: [] },
          components: createSimpleContainers(
            ContainerStyle.ERROR,
            ERROR_MESSAGES.SOMETHING_WENT_WRONG,
          ),
          flags: MessageFlags.IsComponentsV2,
        });

        // Otherwise, edit reply
      } else if (interaction.replied) {
        // Send error
        await interaction.editReply({
          allowedMentions: { parse: [] },
          components: createSimpleContainers(
            ContainerStyle.ERROR,
            ERROR_MESSAGES.SOMETHING_WENT_WRONG,
          ),
          flags: MessageFlags.IsComponentsV2,
        });
      }
    }
  } catch (err) {
    logger.error(ERROR_MESSAGES.unexpectedInteractionError(err));
  }
}

// Function that handles errors for message-based commands
export async function handleMessageCommandError(
  err: unknown,
  message: Message,
): Promise<void> {
  // Return early if an error message cannot be sent
  if (!message.channel.isSendable()) return;

  try {
    // Return early for silent errors
    if (err instanceof SilentError) {
      return;

      // For public errors
    } else if (err instanceof PublicError) {
      await message.reply({
        allowedMentions: { parse: [] },
        components: createSimpleContainers(ContainerStyle.ERROR, err.message),
        flags: MessageFlags.IsComponentsV2,
      });

      // For all other errors
    } else {
      logger.error(ERROR_MESSAGES.unexpectedError(err));

      await message.reply({
        allowedMentions: { parse: [] },
        components: createSimpleContainers(
          ContainerStyle.ERROR,
          ERROR_MESSAGES.SOMETHING_WENT_WRONG,
        ),
        flags: MessageFlags.IsComponentsV2,
      });
    }
  } catch (err) {
    logger.error(ERROR_MESSAGES.unexpectedMessageError(err));
  }
}
