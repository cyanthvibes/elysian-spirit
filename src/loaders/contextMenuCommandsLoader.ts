import { ElysianSpirit } from "classes/client.js";
import { ContextMenuCommand } from "classes/contextMenuCommand.js";
import { Collection } from "discord.js";
import { glob } from "glob";
import { LoaderConfig, loadModulesFromFiles } from "loaders/moduleLoader.js";
import { getLoaderEnv } from "utils/loaderUtils.js";

const { baseDir, ext } = getLoaderEnv();

const files: string[] = glob.sync(
  `${baseDir}/features/**/contextMenuCommand.${ext}`,
);

const contextMenuCommandConfig: LoaderConfig<ContextMenuCommand> = {
  files,
  getKey: (command: ContextMenuCommand): string => command.data.name,
  loaderName: "context-menu commands",
};

export async function loadContextMenuCommands(
  client: ElysianSpirit,
): Promise<void> {
  client.contextMenuCommands = await loadContextMenuCommandsFromFiles();
}

// Loads context-menu commands from the filesystem and validates them
export async function loadContextMenuCommandsFromFiles(): Promise<
  Collection<string, ContextMenuCommand>
> {
  return loadModulesFromFiles(contextMenuCommandConfig);
}
