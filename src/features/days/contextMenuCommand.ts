import { ElysianSpirit } from "classes/client.js";
import { ContextMenuCommand } from "classes/contextMenuCommand.js";
import {
  ApplicationCommandType,
  User,
  UserContextMenuCommandInteraction,
} from "discord.js";
import { handleDaysInteraction } from "src/features/days/handlers.js";
import { UserContextMenuCommandHandler } from "types/commandHandlers.js";
import { withUserContextMenuErrorHandling } from "utils/commandUtils.js";

export default class DaysContextMenuCommand extends ContextMenuCommand {
  execute: UserContextMenuCommandHandler = withUserContextMenuErrorHandling(
    async (
      client: ElysianSpirit,
      interaction: UserContextMenuCommandInteraction,
    ): Promise<void> => {
      if (!interaction.guild) return;

      const targetMember: User = interaction.targetUser;

      await handleDaysInteraction(interaction, targetMember);
    },
  );

  constructor() {
    super("Check how long you, or another member, have been in the clan");

    this.data.setName("days").setType(ApplicationCommandType.User);
  }
}
