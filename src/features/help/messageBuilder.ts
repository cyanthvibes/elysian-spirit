import { ContainerBuilder } from "discord.js";
import { HELP_MESSAGES } from "src/features/help/messages.js";
import {
  AccessibleHelpEntry,
  CommandOptions,
} from "src/features/help/utils.js";
import {
  ContainerStyle,
  MessageBlock,
  MessageChunkType,
} from "types/container.js";
import { buildContainers } from "utils/containers/containersBuilder.js";

// Function that builds the /help message for all commands
export function buildHelpAllCommandsMessage(
  helpEntries: AccessibleHelpEntry[],
): ContainerBuilder[] {
  const blocks: MessageBlock[] = [];

  // Add header block
  blocks.push({
    type: MessageChunkType.MAIN_HEADER_BLOCK,
    value: HELP_MESSAGES.HEADER_IF_SHOWING_ALL_COMMANDS,
  });

  // Build lines for each entry
  const commandLines: string[] = helpEntries.map(
    (entry: AccessibleHelpEntry): string => {
      // Create labels for types
      const typeLabels: string = HELP_MESSAGES.getLabelsForTypes(entry.types);

      // Create the line with command mention/name, label, and description
      return HELP_MESSAGES.entryLineIfShowingAllCommands(entry, typeLabels);
    },
  );
  // Add a content block with entry lines
  blocks.push({
    content: commandLines,
    type: MessageChunkType.CONTENT_BLOCK,
  });

  // Add footer block
  blocks.push({
    type: MessageChunkType.FOOTER_BLOCK,
    value: HELP_MESSAGES.FOOTER_IF_SHOWING_ALL_COMMANDS,
  });

  // Build and return containers
  return buildContainers(ContainerStyle.INFO, blocks);
}

// Function that builds the /help message for a specific command
export function buildHelpSpecificCommandMessage(
  entry: AccessibleHelpEntry,
): ContainerBuilder[] {
  const blocks: MessageBlock[] = [];

  // Create labels for types
  const typeLabels: string = HELP_MESSAGES.getLabelsForTypes(entry.types);

  const header: string = HELP_MESSAGES.formatSpecificCommandHeader(
    entry,
    typeLabels,
  );

  // Add the main header block
  blocks.push({
    type: MessageChunkType.MAIN_HEADER_BLOCK,
    value: header,
  });

  // Add description block
  blocks.push({
    content: [entry.description],
    type: MessageChunkType.CONTENT_BLOCK,
  });

  // Add another content block for the options of the command if they exist
  if (entry.options && entry.options.length > 0) {
    blocks.push({
      content: [
        HELP_MESSAGES.COMMAND_OPTIONS_HEADER,
        ...entry.options.map((option: CommandOptions): string =>
          HELP_MESSAGES.entryOptionsLineIfShowingASpecificCommand(
            option.name,
            option.description,
            option.required,
          ),
        ),
      ],
      type: MessageChunkType.CONTENT_BLOCK,
    });
  }

  // Build and return containers
  return buildContainers(ContainerStyle.INFO, blocks);
}
