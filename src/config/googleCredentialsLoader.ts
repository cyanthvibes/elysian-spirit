import { Config, getConfig } from "config/configLoader.js";
import { LOADER_MESSAGE } from "constants/messages/loaderMessages.js";
import { readFileSync } from "fs";
import { existsSync } from "node:fs";
import { join } from "path";
import { logger } from "utils/logger.js";
import { z } from "zod/v4";
import { ZodSafeParseResult } from "zod/v4";

// Define a schema using Zod to validate required properties for Google credentials
const credentialsSchema = z.object({
  auth_provider_x509_cert_url: z.url(),
  auth_uri: z.url(),
  client_email: z.email(),
  client_id: z.string().min(1),
  client_x509_cert_url: z.url(),
  private_key: z.string().min(1),
  private_key_id: z.string().min(1),
  project_id: z.string().min(1),
  token_uri: z.url(),
  type: z.literal("service_account"),
  universe_domain: z.literal("googleapis.com"),
});

export type GoogleCredentials = z.infer<typeof credentialsSchema>;

let parsedCredentials: Record<string, GoogleCredentials> = {};

// Getter for Google credentials
export function getGoogleCredentials(): Record<string, GoogleCredentials> {
  return parsedCredentials;
}

// Validate Google credential files from schemas
try {
  parsedCredentials = loadGoogleCredentials();
} catch (err) {
  logger.error(LOADER_MESSAGE.googleCredentialsLoadError(err));
  process.kill(process.pid);
  throw err;
}

// Function that reloads the Google credentials files
export function reloadGoogleCredentials(): void {
  parsedCredentials = loadGoogleCredentials();
}

// Function that loads the Google credentials files
function loadGoogleCredentials(): Record<string, GoogleCredentials> {
  const guildCredentials: Record<string, GoogleCredentials> = {};
  const guilds: Config["GUILDS"] = getConfig().GUILDS;

  for (const [guildID] of Object.entries(guilds)) {
    const credentialsPath: string = join(
      process.cwd(),
      "google_credentials",
      `${guildID}_google_credentials.json`,
    );

    if (!existsSync(credentialsPath)) {
      process.kill(process.ppid);
      throw new Error(
        LOADER_MESSAGE.googleCredentialsNotFoundForGuild(
          guildID,
          credentialsPath,
        ),
      );
    }

    const fileContents: string = readFileSync(credentialsPath, "utf-8");
    const credentials: JSON = JSON.parse(fileContents);
    const result: ZodSafeParseResult<GoogleCredentials> =
      credentialsSchema.safeParse(credentials);

    if (!result.success) {
      const errorMessage: string =
        LOADER_MESSAGE.invalidGoogleCredentialsForGuild(
          guildID,
          result.error.issues,
        );
      process.kill(process.ppid);
      throw new Error(errorMessage);
    }
    guildCredentials[guildID] = result.data;
  }

  logger.info(LOADER_MESSAGE.googleCredentialsSuccess(guildCredentials));

  return guildCredentials;
}
