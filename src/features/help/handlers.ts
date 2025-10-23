// Handles /help and autocomplete interactions for the bot
import { ElysianSpirit } from "classes/client.js";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  MessageFlags,
} from "discord.js";
import {
  buildHelpAllCommandsMessage,
  buildHelpSpecificCommandMessage,
} from "src/features/help/messageBuilder.js";
import { HELP_MESSAGES } from "src/features/help/messages.js";
import {
  AccessibleHelpEntry,
  getAccessibleHelpEntries,
} from "src/features/help/utils.js";
import { ContainerStyle } from "types/container.js";
import { createSimpleContainers } from "utils/containers/containersBuilder.js";

// Handles autocomplete for /help command
export async function handleHelpAutocomplete(
  client: ElysianSpirit,
  interaction: AutocompleteInteraction,
): Promise<void> {
  if (!interaction.guild || !interaction.member) return;

  // Get argument from the interaction
  const focusedValue: string = interaction.options
    .getFocused()
    .toLowerCase()
    .trim();

  const member = interaction.member as GuildMember;

  // Get all role IDs for the member
  const memberRoleIDs = new Set(member.roles.cache.keys());

  // Get all accessible help entries for this member
  const helpEntries: AccessibleHelpEntry[] = getAccessibleHelpEntries(
    client,
    interaction.guild.id,
    memberRoleIDs,
  );

  const choicesSet = new Set<string>();

  // Build autocomplete choices
  for (const entry of helpEntries) {
    choicesSet.add(entry.name);
  }

  // Filter choices by member input and format for Discord
  const filtered: { name: string; value: string }[] = Array.from(choicesSet)
    // Only keep choices that match the focusedValue
    .filter((choice: string): boolean => choice.includes(focusedValue))
    // Only keep the first 25 choices (Discord limit)
    .slice(0, 25)
    .map((choice: string): { name: string; value: string } => ({
      name: choice,
      value: choice,
    }));

  // Respond to Discord with filtered choices
  await interaction.respond(filtered);
}

// Handles /help slash command
export async function handleHelpInteraction(
  client: ElysianSpirit,
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!interaction.guild || !interaction.member) return;

  await interaction.reply({
    components: createSimpleContainers(
      ContainerStyle.INFO,
      HELP_MESSAGES.CHECKING,
    ),
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });

  // Get argument from the interaction
  const commandInput: string = interaction.options.getString("command") ?? "";

  const member = interaction.member as GuildMember;
  const guildID: string = interaction.guild.id;

  // Get all role IDs for the member
  const userRoleIDs = new Set(member.roles.cache.keys());

  // Get all accessible help entries for this member
  const helpEntries: AccessibleHelpEntry[] = getAccessibleHelpEntries(
    client,
    guildID,
    userRoleIDs,
  );

  // If no specific command is requested, show all
  if (!commandInput) {
    // If no commands are available for this user, reply accordingly
    if (helpEntries.length === 0) {
      await interaction.editReply({
        components: createSimpleContainers(
          ContainerStyle.ERROR,
          HELP_MESSAGES.NO_COMMANDS_AVAILABLE,
        ),
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      });

      return;
    }

    // Otherwise, show all commands
    await interaction.editReply({
      components: buildHelpAllCommandsMessage(helpEntries),
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });

    return;
  }

  // Otherwise, a specific command is provided

  const entry: AccessibleHelpEntry | undefined = helpEntries.find(
    (entry: AccessibleHelpEntry): boolean => entry.name === commandInput.trim(),
  );

  // If the specified command is not found
  if (!entry) {
    // Respond accordingly
    await interaction.editReply({
      components: createSimpleContainers(
        ContainerStyle.ERROR,
        HELP_MESSAGES.commandNotFound(commandInput),
      ),
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });

    return;
  }

  // Otherwise, the specified command is found, respond with specific command help
  await interaction.editReply({
    components: buildHelpSpecificCommandMessage(entry),
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
  });
}
