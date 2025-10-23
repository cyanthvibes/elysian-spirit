import { LOADER_MESSAGE } from "constants/messages/loaderMessages.js";
import { readFileSync } from "fs";
import { existsSync } from "node:fs";
import { z } from "zod/v4";

const configFile = "config.json";

if (!existsSync(configFile)) {
  process.kill(process.ppid);
  throw new Error(LOADER_MESSAGE.MISSING_CONFIG);
}

// Define a schema using Zod to validate properties of a guild in config.json
const guildConfigSchema = z.object({
  CHANNEL_IDS: z.object({
    BOT_CHANNEL: z.string().min(1),
    OSRS_CLAN_CHAT_CHANNEL: z.string().min(1).optional(),
  }),
  PREFIX: z.string().min(1),
  ROLE_IDS: z.object({
    CLAN_STAFF: z.string().min(1),
    GUEST: z.string().min(1),
    MEMBER_PERMS: z.string().min(1),
  }),
  SPREADSHEET_COLUMNS: z.object({
    ALTS: z
      .string()
      .regex(/^[A-Z]+$/)
      .optional(),
    DAYS: z
      .string()
      .regex(/^[A-Z]+$/)
      .optional(),
    DISCORD_ID: z.string().regex(/^[A-Z]+$/),
    RSN: z.string().regex(/^[A-Z]+$/),
  }),
  SPREADSHEET_ID: z.string().min(1),
  SPREADSHEET_ROWS: z.object({
    END_ROW: z.int().positive().optional(),
    START_ROW: z.int().positive(),
  }),
  SPREADSHEET_SHEET: z.string().min(1),
});

// Define a schema using Zod to validate properties of all the guilds in config.json
const configSchema = z.object({
  GUILDS: z.record(z.string().min(1), guildConfigSchema),
});

export type Config = z.infer<typeof configSchema>;
export type GuildConfig = z.infer<typeof guildConfigSchema>;

let parsedConfig: Config;

// Getter for config.json
export function getConfig(): Config {
  return parsedConfig;
}

// Validate config.json using schemas
try {
  parsedConfig = loadConfig();
} catch (err) {
  process.kill(process.ppid);
  throw err;
}

// Function that reloads config.json
export function reloadConfig(): void {
  parsedConfig = loadConfig();
}

// Function that loads config.json
function loadConfig(): Config {
  const raw: string = readFileSync(configFile, "utf-8");
  const json: JSON = JSON.parse(raw);
  const result = configSchema.safeParse(json);

  if (!result.success) {
    const errorMessage: string = LOADER_MESSAGE.invalidConfig(
      configFile,
      result.error.issues,
    );

    process.kill(process.ppid);
    throw new Error(errorMessage);
  }

  return result.data;
}
