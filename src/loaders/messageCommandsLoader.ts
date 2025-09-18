import { ElysianSpirit } from "classes/client.js";
import { MessageCommand } from "classes/messageCommand.js";
import { Collection } from "discord.js";
import { glob } from "glob";
import { LoaderConfig, loadModulesFromFiles } from "loaders/moduleLoader.js";
import { getLoaderEnv } from "utils/loaderUtils.js";

const { baseDir, ext } = getLoaderEnv();

const files: string[] = glob.sync(
  `${baseDir}/features/**/messageCommand.${ext}`,
);

const messageCommandConfig: LoaderConfig<MessageCommand> = {
  files,
  getKey: (command: MessageCommand): string => command.name,
  loaderName: "message commands",
};

export async function loadMessageCommands(
  client: ElysianSpirit,
): Promise<void> {
  client.messageCommands = await loadMessageCommandsFromFiles();
}

// Loads message-based commands from the filesystem and validates them
export async function loadMessageCommandsFromFiles(): Promise<
  Collection<string, MessageCommand>
> {
  return loadModulesFromFiles(messageCommandConfig);
}
