import { LOADER_MESSAGE } from "constants/messages/loaderMessages.js";
import { Collection } from "discord.js";
import path from "node:path";
import { ZodValidationResult } from "types/zodValidation.js";
import { pathToFileURL } from "url";
import { logger } from "utils/logger.js";
import { $ZodIssue } from "zod/v4/core";

export interface Loadable {
  validate(): ZodValidationResult;
}

export interface LoaderConfig<T extends Loadable> {
  files: string[];
  getKey: (item: T) => string;
  loaderName: string;
  postProcess?: (item: T, fileName: string) => void;
}

export function formatValidationErrors(errors: $ZodIssue[]): string {
  return LOADER_MESSAGE.validationError(errors);
}

export async function loadModulesFromFiles<T extends Loadable>(
  config: LoaderConfig<T>,
): Promise<Collection<string, T>> {
  logger.info(LOADER_MESSAGE.loadingModule(config.loaderName));

  const modules = new Collection<string, T>();

  // File extensions depending on environment
  const extension: string =
    process.env.FORCE_TS === "true"
      ? ".ts"
      : process.env.NODE_ENV === "production"
        ? ".js"
        : ".ts";

  const FEATURE_FOLDER_TO_IGNORE: string[] = ["src/features/submit"];

  const filesToProcess: string[] = (config.files || []).filter(
    (file: string): boolean => {
      const normalisedFile: string = path.normalize(file);

      // Ignore if the file is inside any ignored folder
      return (
        file.endsWith(extension) &&
        !FEATURE_FOLDER_TO_IGNORE.some((folder: string): boolean => {
          const normalisedFolder: string = path.normalize(folder + path.sep);

          return normalisedFile.includes(normalisedFolder);
        })
      );
    },
  );

  if (filesToProcess.length === 0) {
    logger.warn(LOADER_MESSAGE.noFilesProvided(config.loaderName));

    return modules;
  }

  for (const filePath of filesToProcess) {
    const fileName: string = filePath.split("/").pop() || "unknown";

    try {
      const importPath: string = pathToFileURL(filePath).toString();
      const module = await import(importPath);
      const moduleInstance = new module.default();

      const validate = moduleInstance.validate();

      if (validate !== true) {
        logger.error(
          LOADER_MESSAGE.loadingModuleError(
            config.loaderName.slice(0, -1),
            fileName,
            validate.error?.errors,
          ),
        );
        logger.info(
          LOADER_MESSAGE.skippedLoading(
            config.loaderName.slice(0, -1),
            fileName,
          ),
        );

        continue;
      }

      const key: string = config.getKey(moduleInstance);

      modules.set(key, moduleInstance);

      config.postProcess?.(moduleInstance, fileName);

      logger.info(
        LOADER_MESSAGE.loadingModuleSuccessful(config.loaderName, key),
      );
    } catch (err) {
      logger.error(
        LOADER_MESSAGE.loadingModuleFailed(
          config.loaderName.slice(0, -1),
          filePath,
          err,
        ),
      );
      logger.info(
        LOADER_MESSAGE.skippedLoading(config.loaderName.slice(0, -1), filePath),
      );
    }
  }

  logger.info(
    LOADER_MESSAGE.loadingModulesSummary(
      modules.size,
      config.loaderName.slice(0, -1),
    ),
  );

  return modules;
}
