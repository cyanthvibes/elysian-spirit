import { ElysianSpirit } from "classes/client.js";
import { ContextMenuCommand } from "classes/contextMenuCommand.js";
import {
  ApplicationCommandType,
  User,
  UserContextMenuCommandInteraction,
} from "discord.js";
import { handleBalanceInteraction } from "src/features/balance/handlers.js";
import { UserContextMenuCommandHandler } from "types/commandHandlers.js";
import { withUserContextMenuErrorHandling } from "utils/commandUtils.js";

export default class BalanceContextMenuCommand extends ContextMenuCommand {
  execute: UserContextMenuCommandHandler = withUserContextMenuErrorHandling(
    async (
      client: ElysianSpirit,
      interaction: UserContextMenuCommandInteraction,
    ): Promise<void> => {
      if (!interaction.guild) return;

      const targetMember: User = interaction.targetUser;

      await handleBalanceInteraction(interaction, targetMember);
    },
  );

  constructor() {
    super("Get a balance of your clan points, or from another member");

    this.data.setName("balance").setType(ApplicationCommandType.User);
  }
}
