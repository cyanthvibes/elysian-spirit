import { ElysianSpirit } from "classes/client.js";
import { MessageCommand } from "classes/messageCommand.js";
import { reloadGoogleCredentials } from "config/googleCredentialsLoader.js";
import {
  reportGoogleCredentialsValidation,
  validateGoogleCredentials,
} from "config/googleCredentialsUtils.js";
import { LOADER_MESSAGE } from "constants/messages/loaderMessages.js";
import { Message } from "discord.js";
import { MessageCommandHandler } from "types/commandHandlers.js";
import { GoogleCredentialsReport } from "types/googleCredentialsValidation.js";
import { withMessageCommandErrorHandling } from "utils/commandUtils.js";

export default class ReloadGoogleCredentials extends MessageCommand {
  execute: MessageCommandHandler = withMessageCommandErrorHandling(
    async (
      client: ElysianSpirit,
      message: Message,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      args: string[],
    ): Promise<void> => {
      const sentMessage: Message = await message.reply(
        LOADER_MESSAGE.RELOADING_GOOGLE_CREDENTIALS,
      );

      // Reload Google credentials first
      reloadGoogleCredentials();

      await sentMessage.edit(LOADER_MESSAGE.VALIDATING_GOOGLE_CREDENTIALS);

      // Validate Google credentials
      const errorsByGuild: Record<string, string[]> =
        await validateGoogleCredentials();

      const result: GoogleCredentialsReport = reportGoogleCredentialsValidation(
        errorsByGuild,
        "reload",
      );

      await sentMessage.edit(result.message);
    },
  );

  constructor() {
    super({
      allowedChannelKeys: [],
      description: "Reload all Google credential files",
      isPrivileged: true,
      name: "reload_google_credentials",
      ownerOnly: true,
      requiredRoleKeys: [],
    });
  }
}
