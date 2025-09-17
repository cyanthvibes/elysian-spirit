import { ElysianSpirit } from "classes/client.js";
import { MessageCommand } from "classes/messageCommand.js";
import { reloadConfig } from "config/configLoader.js";
import { reportConfigValidation, validateConfig } from "config/configUtils.js";
import { LOADER_MESSAGE } from "constants/messages/loaderMessages.js";
import { Message } from "discord.js";
import { MessageCommandHandler } from "types/commandHandlers.js";
import { ConfigValidationReport } from "types/configValidation.js";
import { withMessageCommandErrorHandling } from "utils/commandUtils.js";

export default class ReloadConfig extends MessageCommand {
  execute: MessageCommandHandler = withMessageCommandErrorHandling(
    async (
      client: ElysianSpirit,
      message: Message,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      args: string[],
    ): Promise<void> => {
      const sentMessage: Message = await message.reply(
        LOADER_MESSAGE.RELOADING_CONFIG,
      );

      // Reload config first
      reloadConfig();

      await sentMessage.edit(LOADER_MESSAGE.VALIDATING_CONFIG);

      // Validate config.json
      const errorsByGuild: Record<string, string[]> = validateConfig(client);

      const result: ConfigValidationReport = reportConfigValidation(
        errorsByGuild,
        "reload",
      );

      await sentMessage.edit(result.message);
    },
  );

  constructor() {
    super({
      allowedChannelKeys: [],
      description: "Reload config.json",
      isPrivileged: true,
      name: "reload_config",
      ownerOnly: true,
      requiredRoleKeys: [],
    });
  }
}
