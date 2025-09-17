import { ElysianSpirit } from "classes/client.js";
import { SlashCommand } from "classes/slashCommand.js";
import { Collection } from "discord.js";
import { glob } from "glob";
import { LoaderConfig, loadModulesFromFiles } from "loaders/moduleLoader.js";

const useTs: boolean = process.env.FORCE_TS === "true";
const baseDir: string = useTs
  ? "src"
  : process.env.NODE_ENV === "production"
    ? "dist"
    : "src";
const ext: string = useTs
  ? "ts"
  : process.env.NODE_ENV === "production"
    ? "js"
    : "ts";

const files: string[] = glob.sync(`${baseDir}/features/**/slashCommand.${ext}`);

const slashCommandConfig: LoaderConfig<SlashCommand> = {
  files,
  getKey: (command: SlashCommand): string => command.data.name,
  loaderName: "slash commands",
};

export async function loadSlashCommands(client: ElysianSpirit): Promise<void> {
  client.slashCommands = await loadSlashCommandsFromFiles();
}

// Loads slash commands from the filesystem and validates them
export async function loadSlashCommandsFromFiles(): Promise<
  Collection<string, SlashCommand>
> {
  return loadModulesFromFiles(slashCommandConfig);
}
