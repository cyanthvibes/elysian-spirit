import { ElysianSpirit } from "classes/client.js";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Message,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
} from "discord.js";

export type AutocompleteInteractionHandler = (
  client: ElysianSpirit,
  interaction: AutocompleteInteraction,
) => Promise<void>;

export type MessageCommandHandler = (
  client: ElysianSpirit,
  message: Message,
  args: string[],
) => Promise<void>;

export type MessageContextMenuCommandHandler = (
  client: ElysianSpirit,
  interaction: MessageContextMenuCommandInteraction,
) => Promise<void>;

export type SlashCommandHandler = (
  client: ElysianSpirit,
  interaction: ChatInputCommandInteraction,
) => Promise<void>;

export type UserContextMenuCommandHandler = (
  client: ElysianSpirit,
  interaction: UserContextMenuCommandInteraction,
) => Promise<void>;
