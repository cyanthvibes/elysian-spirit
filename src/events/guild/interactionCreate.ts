import { ElysianSpirit } from "classes/client.js";
import { ContextMenuCommand } from "classes/contextMenuCommand.js";
import { Event } from "classes/event.js";
import { SlashCommand } from "classes/slashCommand.js";
import { getConfigErrors } from "config/configUtils.js";
import { getGoogleCredentialsErrors } from "config/googleCredentialsUtils.js";
import { ERROR_MESSAGES } from "constants/messages/errorMessages.js";
import {
  ApplicationCommandType,
  ChatInputCommandInteraction,
  Events,
  Interaction,
  MessageContextMenuCommandInteraction,
  MessageFlags,
  UserContextMenuCommandInteraction,
} from "discord.js";
// import { trackActivity } from "src/features/activity/utils.js";
import { ContainerStyle } from "types/container.js";
import { createSimpleContainers } from "utils/containers/containersBuilder.js";
import { EphemeralError, PublicError } from "utils/errorUtils.js";

type InteractionType =
  | ChatInputCommandInteraction
  | MessageContextMenuCommandInteraction
  | UserContextMenuCommandInteraction;

export default class InteractionCreateEvent extends Event<Events.InteractionCreate> {
  constructor() {
    super(Events.InteractionCreate);
  }

  async execute(
    client: ElysianSpirit,
    interaction: Interaction,
  ): Promise<void> {
    if (interaction.user?.bot) return;

    if (!interaction.guild) return;

    // Check if the guild the interaction was in, has errors in config.json
    const configErrors: string[] = getConfigErrors()[interaction.guild.id];

    // Check if the guild the interaction was in, has Google credentials errors
    const googleCredentialsErrors: string[] =
      getGoogleCredentialsErrors()[interaction.guild.id];

    // Exit early if there are errors for the guild the interaction was in
    if (configErrors.length || googleCredentialsErrors.length) {
      return;
    }

    // Member activity is no longer tracked through interactions. The ability
    // to do this is still present but commented out for now.

    // Track activity early, even if later on permission checks fail
    // await trackActivity(interaction.guild, interaction.user.id);

    if (interaction.isAutocomplete()) {
      const slashCommand: SlashCommand | undefined = client.slashCommands.get(
        interaction.commandName,
      );

      if (!slashCommand) return;

      await slashCommand.autocomplete(client, interaction);
      return;
    }

    try {
      // If the interaction was a slash command
      if (interaction.isChatInputCommand()) {
        // Get the slash command from the client collection
        const slashCommand: SlashCommand | undefined = client.slashCommands.get(
          interaction.commandName,
        );

        // If somehow the slash command doesn't exist, just return
        if (!slashCommand) return;

        // Do a permission check
        await slashCommand.checkPermissions(interaction);

        // Then, execute the command if checks pass
        await slashCommand.execute(client, interaction);
      }

      // If the interaction was a context-menu command
      if (interaction.isContextMenuCommand()) {
        // Get the context-menu command from the client collection
        const contextMenuCommand: ContextMenuCommand | undefined =
          client.contextMenuCommands.get(interaction.commandName);

        // If somehow the context-menu command doesn't exist, just return
        if (!contextMenuCommand) return;

        // If the context-menu command is on a member
        if (interaction.commandType === ApplicationCommandType.User) {
          const memberInteraction =
            interaction as UserContextMenuCommandInteraction;

          // Do a permission check
          await contextMenuCommand.checkPermissions(memberInteraction);

          // Then, execute the command if checks pass
          await contextMenuCommand.execute(client, memberInteraction);

          // If the context-menu command is on a message
        } else if (interaction.commandType === ApplicationCommandType.Message) {
          const messageInteraction =
            interaction as MessageContextMenuCommandInteraction;

          // If somehow the context-menu command doesn't exist, just return
          if (!messageInteraction) return;

          // Do a permission check
          await contextMenuCommand.checkPermissions(messageInteraction);

          // Then, execute the command if checks pass
          await contextMenuCommand.execute(client, messageInteraction);
        }
      }
    } catch (err) {
      const error = err as Error;
      const errorMessage: string =
        error.message || ERROR_MESSAGES.SOMETHING_WENT_WRONG;

      const knownInteraction = interaction as InteractionType;

      const isEphemeral: MessageFlags.Ephemeral | undefined =
        error instanceof EphemeralError || !(error instanceof PublicError)
          ? MessageFlags.Ephemeral
          : undefined;

      try {
        await knownInteraction.deferReply({ flags: isEphemeral });
      } catch {
        /* empty */
      }

      try {
        await knownInteraction.editReply({
          allowedMentions: { parse: [] },
          components: createSimpleContainers(
            ContainerStyle.ERROR,
            errorMessage,
          ),
          flags: MessageFlags.IsComponentsV2,
        });
      } catch {
        /* empty */
      }
    }
  }
}
