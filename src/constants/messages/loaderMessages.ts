import { GoogleCredentials } from "config/googleCredentialsLoader.js";
import { EMOJIS } from "constants/emojis.js";
import { formatValidationErrors } from "loaders/moduleLoader.js";
import { pluralise } from "utils/formatUtils.js";
import { $ZodIssue } from "zod/v4/core";

export const LOADER_MESSAGE = {
  channelNotFound: (guildID: string, channelID: string): string =>
    `${EMOJIS.ERROR} Channel ${channelID} not found in guild: ${guildID}`,

  CONFIG_RELOADED_AND_VALIDATED_SUCCESSFULLY: `${EMOJIS.SUCCESS} Config reloaded and validated successfully!`,
  CONFIG_VALIDATED_SUCCESSFULLY: `${EMOJIS.SUCCESS} config.json succssfully validated!`,

  envFileMissing: (envFile: string): string =>
    `${EMOJIS.ERROR} Missing .env-file: ${envFile}`,

  G_C_RELOADED_AND_VALIDATED_SUCCESSFULLY: `${EMOJIS.SUCCESS} Google credentials reloaded and validated successfully!`,
  G_C_VALIDATED_SUCCESSFULLY: `${EMOJIS.SUCCESS} Google credentials successfully validated!`,

  googleCredentialsLoadError: (err: unknown): string =>
    [`${EMOJIS.ERROR} Failed to load Google credentials:`, `${err}`].join("\n"),

  googleCredentialsNotFoundForGuild: (
    guildID: string,
    credentialsPath: string,
  ): string =>
    `${EMOJIS.ERROR} Google credentials not found for guild ${guildID} at ${credentialsPath}`,

  googleCredentialsSuccess: (
    guildCredentials: Record<string, GoogleCredentials>,
  ): string =>
    `${EMOJIS.SUCCESS} Loaded Google credentials for ${Object.keys(guildCredentials).length} ${pluralise(Object.keys(guildCredentials).length, "guild")}`,

  googleSheetsAPIError: (err: unknown): string =>
    `${EMOJIS.ERROR} Google Sheets API error: ${(err as { message?: string })?.message ?? String(err)}`,

  guildConfigMissing: (guildID: string): string =>
    `${EMOJIS.ERROR} Config not found for guild ${guildID}`,

  guildNotFound: (guildID: string): string =>
    `${EMOJIS.ERROR} Guild not found for ID: ${guildID}`,

  INVALID_NODE_ENV: `${EMOJIS.ERROR} NODE_ENV must be set to "development" or "production"`,

  invalidConfig: (configFile: string, issues: $ZodIssue[]): string => {
    return [
      `${EMOJIS.ERROR} Invalid config file: ${configFile}`,
      `${issues
        .map((err: $ZodIssue): string => `${err.path} - ${err.message}`)
        .join("\n")}`,
    ].join("\n");
  },
  invalidEnvironmentVariable: (
    issues: $ZodIssue[],
    envFile: string,
  ): string => {
    return [
      `${EMOJIS.ERROR} Invalid environment ${pluralise(issues.length, "variable")} in: ${envFile}`,
      `${issues
        .map((err: $ZodIssue): string => `${err.path} - ${err.message}`)
        .join("\n")}`,
    ].join("\n");
  },

  invalidGoogleCredentialsForGuild: (
    guildID: string,
    issues: $ZodIssue[],
  ): string => {
    return [
      `${EMOJIS.ERROR} Invalid Google credentials for guild ${guildID}`,
      `${issues
        .map((err: $ZodIssue): string => `${err.path} - ${err.message}`)
        .join("\\n")};
    `,
    ].join("\n");
  },

  loadingModule: (name: string): string =>
    `${EMOJIS.CHECKING} Loading ${name}...`,

  loadingModuleError: (
    name: string,
    fileName: string,
    errors: $ZodIssue[],
  ): string =>
    [
      `${EMOJIS.ERROR} Error in ${name} file '${fileName}':`,
      `${formatValidationErrors(errors || [])}`,
    ].join("\n"),

  loadingModuleFailed: (name: string, fileName: string, err: unknown): string =>
    [
      `${EMOJIS.ERROR} Failed to load ${name} file '${fileName}':`,
      `${err instanceof Error ? err.stack : err}`,
    ].join("\n"),

  loadingModulesSummary: (size: number, name: string): string =>
    `${EMOJIS.SUCCESS} Successfully loaded ${size} ${pluralise(size, name)}`,

  loadingModuleSuccessful: (name: string, key: string): string =>
    `${EMOJIS.SUCCESS} ${name.slice(0, -1).charAt(0).toUpperCase()}${name.slice(1, -1)} '${key}' loaded`,

  MISSING_CONFIG: `${EMOJIS.ERROR} Missing config.json`,

  noFilesProvided: (loaderName: string): string =>
    `No files provided to loadModulesFromFiles for ${loaderName}`,

  RELOADING_CONFIG: `${EMOJIS.CHECKING} Reloading config...`,
  RELOADING_GOOGLE_CREDENTIALS: `${EMOJIS.CHECKING} Reloading Google credentials...`,

  roleNotFound: (guildID: string, roleID: string): string =>
    `${EMOJIS.ERROR} Role ${roleID} not found in guild: ${guildID}`,

  skippedLoading: (name: string, fileName: string): string =>
    `${EMOJIS.ERROR} Skipped loading ${name} file '${fileName}'`,

  VALIDATING_CONFIG: `${EMOJIS.CHECKING} Validating config...`,
  VALIDATING_GOOGLE_CREDENTIALS: `${EMOJIS.CHECKING} Validating Google credentials...`,

  validationError: (errors: $ZodIssue[]): string => {
    return errors
      .map((err: $ZodIssue): string => `${err.path}: ${err.message}`)
      .join("\n");
  },
} as const;
