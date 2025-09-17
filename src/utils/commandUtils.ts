import { ElysianSpirit } from "classes/client.js";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Message,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
} from "discord.js";
import {
  AutocompleteInteractionHandler,
  MessageCommandHandler,
  MessageContextMenuCommandHandler,
  SlashCommandHandler,
  UserContextMenuCommandHandler,
} from "types/commandHandlers.js";
import {
  handleAutocompleteInteractionError,
  handleInteractionError,
  handleMessageCommandError,
} from "utils/errorUtils.js";

// Wrapper function for autocomplete interactions
export function withAutocompleteInteractionHandling(
  handler: AutocompleteInteractionHandler,
): AutocompleteInteractionHandler {
  return async (
    client: ElysianSpirit,
    interaction: AutocompleteInteraction,
  ): Promise<void> => {
    try {
      await handler(client, interaction);
    } catch (err) {
      await handleAutocompleteInteractionError(err, interaction);
    }
  };
}

// Wrapper function for message-based commands execution
export function withMessageCommandErrorHandling(
  handler: MessageCommandHandler,
): MessageCommandHandler {
  return async (
    client: ElysianSpirit,
    message: Message,
    args: string[],
  ): Promise<void> => {
    try {
      await handler(client, message, args);
    } catch (err) {
      await handleMessageCommandError(err, message);
    }
  };
}

// Wrapper function for message context-menu commands execution
export function withMessageContextMenuErrorHandling(
  handler: MessageContextMenuCommandHandler,
): MessageContextMenuCommandHandler {
  return async (
    client: ElysianSpirit,
    interaction: MessageContextMenuCommandInteraction,
  ): Promise<void> => {
    try {
      await handler(client, interaction);
    } catch (err) {
      await handleInteractionError(err, interaction);
    }
  };
}

// Wrapper function for slash command execution
export function withSlashCommandErrorHandling(
  handler: SlashCommandHandler,
): SlashCommandHandler {
  return async (
    client: ElysianSpirit,
    interaction: ChatInputCommandInteraction,
  ): Promise<void> => {
    try {
      await handler(client, interaction);
    } catch (err) {
      await handleInteractionError(err, interaction);
    }
  };
}

// Wrapper function for user context-menu commands execution
export function withUserContextMenuErrorHandling(
  handler: UserContextMenuCommandHandler,
): UserContextMenuCommandHandler {
  return async (
    client: ElysianSpirit,
    interaction: UserContextMenuCommandInteraction,
  ): Promise<void> => {
    try {
      await handler(client, interaction);
    } catch (err) {
      await handleInteractionError(err, interaction);
    }
  };
}
