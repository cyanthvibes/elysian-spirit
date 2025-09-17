import { LOADER_MESSAGE } from "constants/messages/loaderMessages.js";
import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { z, ZodSafeParseResult } from "zod/v4";

// Determine the current environment (development or production)
const NODE_ENV: string | undefined = process.env.NODE_ENV;

// Choose the appropriate .env file based on the environment
const envFile: string =
  NODE_ENV === "production" ? ".env.production" : ".env.development";

// Validate NODE_ENV (must be either "development" or "production")
if (!NODE_ENV || !["development", "production"].includes(NODE_ENV)) {
  process.kill(process.ppid);
  throw new Error(LOADER_MESSAGE.INVALID_NODE_ENV);
}

// Check if the corresponding .env file exists
if (!existsSync(envFile)) {
  process.kill(process.ppid);
  throw new Error(LOADER_MESSAGE.envFileMissing(envFile));
}

// Load the environment variables from the .env file
dotenv.config({ path: envFile });

// Define a schema using Zod to validate required environment variables
const environmentSchema = z.object({
  BOT_ID: z.string().min(1),
  BOT_TOKEN: z.string().min(1),
  DATABASE_URL: z.url(),
  DEFAULT_PREFIX: z.string().min(1),
  OWNER_ID: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  TEST_GUILD_ID:
    NODE_ENV === "development"
      ? z.string().min(1)
      : z.string().min(1).optional(),
});

// Type definition inferred from Zod schema
export type EnvConfig = z.infer<typeof environmentSchema>;

// Parse and validate environment variables
const parsedEnv: ZodSafeParseResult<EnvConfig> = environmentSchema.safeParse(
  process.env,
);

// If validation fails, exit the process
if (!parsedEnv.success) {
  const errorMessage: string = LOADER_MESSAGE.invalidEnvironmentVariable(
    parsedEnv.error.issues,
    envFile,
  );
  process.kill(process.ppid);
  throw new Error(errorMessage);
}

// Export validated environment variables
export const env: EnvConfig = parsedEnv.data;
