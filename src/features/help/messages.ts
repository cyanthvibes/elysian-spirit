import { EMOJIS } from "constants/emojis.js";
import {
  ApplicationCommandType,
  bold,
  inlineCode,
  italic,
  subtext,
} from "discord.js";
import { AccessibleHelpEntry } from "src/features/help/utils.js";

export const HELP_MESSAGES = {
  CHECKING: `${EMOJIS.CHECKING} Getting commands for you...`,
  COMMAND_OPTIONS_HEADER: "\nOptions:",

  commandNotFound: (commandName: string): string => {
    return `Command ${inlineCode(commandName)} not found, or you don't have the permission to use it.`;
  },

  entryLineIfShowingAllCommands: (
    entry: AccessibleHelpEntry,
    typeLabels: string,
  ): string => {
    if (entry.isMention) {
      return `- ${bold(entry.mention)} ${typeLabels ? ` ${typeLabels}` : ""}: ${entry.description}`;
    } else {
      return `- ${bold(`/${entry.name}`)} ${typeLabels ? ` ${typeLabels}` : ""}: ${entry.description}`;
    }
  },

  entryOptionsLineIfShowingASpecificCommand: (
    name: string,
    description: string,
    required: boolean,
  ): string =>
    `- ${bold(name)}: ${description} ${required ? `${italic("(required)")}` : `${italic("(optional)")}`}`,

  FOOTER_IF_SHOWING_ALL_COMMANDS: `${subtext(`Use ${inlineCode("/help <command>")} or ${inlineCode("/help <command>")} for detailed info about a specific command.`)}`,

  formatSpecificCommandHeader: (
    entry: AccessibleHelpEntry,
    typeLabels: string,
  ): string => {
    if (entry.isMention) {
      return `${EMOJIS.COMMAND} ${entry.mention} ${typeLabels ? `${typeLabels}` : ""}`;
    } else {
      return `${EMOJIS.COMMAND} /${entry.name} ${typeLabels ? `${typeLabels}` : ""}`;
    }
  },

  // Returns a usage label for a command type
  getLabelForType: (type?: ApplicationCommandType): string => {
    if (type === undefined) return "";
    if (type === ApplicationCommandType.ChatInput)
      return `use a ${inlineCode("/")}`;
    if (type === ApplicationCommandType.User) return "right-click a user";
    if (type === ApplicationCommandType.Message) return "right-click a message";
    return "";
  },

  // Returns usage labels for a list of command types
  getLabelsForTypes: (types: ApplicationCommandType[]): string => {
    const otherTypes: ApplicationCommandType[] = types.filter(
      (type: ApplicationCommandType): boolean =>
        type !== ApplicationCommandType.ChatInput,
    );

    const labels: string[] = otherTypes
      .map((type: ApplicationCommandType): string =>
        HELP_MESSAGES.getLabelForType(type),
      )
      .filter(Boolean);

    // Only show label for ChatInput if any other label is present
    if (labels.length > 0 && types.includes(ApplicationCommandType.ChatInput)) {
      labels.unshift(
        HELP_MESSAGES.getLabelForType(ApplicationCommandType.ChatInput),
      );
    }

    if (labels.length === 0) return "";
    if (labels.length === 1) return `(${labels[0]})`;
    if (labels.length === 2) return `(${labels[0]} or ${labels[1]})`;
    return `(${labels.slice(0, -1).join(", ")}, or ${labels[labels.length - 1]})`;
  },

  HEADER_IF_SHOWING_ALL_COMMANDS: `${EMOJIS.COMMANDS} ${bold("Available commands")}`, // Header for all commands
  NO_COMMANDS_AVAILABLE: `${EMOJIS.ERROR} No commands available to you.`, // Message for no commands
  SUBCOMMANDS_HEADER_IF_AVAILABLE: "\nSubcommands:", // Header for subcommands block
} as const;
