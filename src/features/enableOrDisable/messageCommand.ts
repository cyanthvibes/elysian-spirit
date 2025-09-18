import { ElysianSpirit } from "classes/client.js";
import { MessageCommand } from "classes/messageCommand.js";
import { getGuildConfig } from "config/configUtils.js";
import { setCommandsEnabled } from "database/repositories/guilds/guildRepository.js";
import { Message } from "discord.js";
import { ENABLE_OR_DISABLE_MESSAGE } from "src/features/enableOrDisable/messages.js";
import { MessageCommandHandler } from "types/commandHandlers.js";
import { withMessageCommandErrorHandling } from "utils/commandUtils.js";

export default class EnableOrDisableCommands extends MessageCommand {
  execute: MessageCommandHandler = withMessageCommandErrorHandling(
    async (
      client: ElysianSpirit,
      message: Message,
      args: string[],
    ): Promise<void> => {
      if (!message.guild) return;
      // Get action from arguments
      const action: string = args[0]?.toLowerCase();

      if (action === "enable") {
        const sentMessage: Message = await message.reply(
          ENABLE_OR_DISABLE_MESSAGE.actionMessage(true),
        );

        await setCommandsEnabled(message.guild.id, true);
        client.guildCommandsEnabledStateCache.set(message.guild.id, true);

        await sentMessage.edit(ENABLE_OR_DISABLE_MESSAGE.resultMessage(true));
      } else if (action === "disable") {
        const sentMessage: Message = await message.reply(
          ENABLE_OR_DISABLE_MESSAGE.actionMessage(false),
        );

        await setCommandsEnabled(message.guild.id, false);
        client.guildCommandsEnabledStateCache.set(message.guild.id, false);

        await sentMessage.edit(ENABLE_OR_DISABLE_MESSAGE.resultMessage(false));
      } else {
        await message.reply(
          `Usage: ${getGuildConfig(message.guild.id).PREFIX}command <enable|disable>`,
        );
      }
    },
  );

  constructor() {
    super({
      allowedChannelKeys: [],
      description: "Enable or disable commands",
      isPrivileged: true,
      name: "commands",
      ownerOnly: true,
      requiredRoleKeys: [],
    });
  }
}
