import { ElysianSpirit } from "classes/client.js";
import { glob } from "glob";
import {
  Loadable,
  LoaderConfig,
  loadModulesFromFiles,
} from "loaders/moduleLoader.js";
import { getLoaderEnv } from "utils/loaderUtils.js";

interface Event extends Loadable {
  execute(client: ElysianSpirit, ...args: unknown[]): void;
  name: string;
  once?: boolean;
}

const { baseDir, ext } = getLoaderEnv();

const files: string[] = glob.sync(`${baseDir}/events/**/*.${ext}`);

// Loads and binds all events to the client
export async function loadEvents(client: ElysianSpirit): Promise<void> {
  const eventConfig: LoaderConfig<Event> = {
    files,
    getKey: (event: Event): string => event.name,
    loaderName: "events",
    postProcess: (event: Event): void => {
      // Bind event to the client after loading
      // If the event should only be fired once
      if (event.once) {
        client.once(event.name, (...args: unknown[]): void =>
          event.execute(client, ...args),
        );

        // Else, always fire events
      } else {
        client.on(event.name, (...args: unknown[]): void =>
          event.execute(client, ...args),
        );
      }
    },
  };

  // We load the events but don't need to store the collection
  // The postProcess function handles binding them to the client
  await loadModulesFromFiles(eventConfig);
}
