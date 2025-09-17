import { REPOSITORY_MESSAGES } from "constants/messages/repositoryMessages.js";
import { prisma } from "database/client.js";
import { Guild } from "discord.js";
import { Guild as GuildModel } from "src/generated/prisma/client.js";
import { EphemeralError } from "utils/errorUtils.js";
import { logger } from "utils/logger.js";

// Function that makes sure the guild exists in the database
export async function ensureGuild(guild: Guild): Promise<void> {
  try {
    await prisma.guild.upsert({
      create: {
        guildID: guild.id,
      },
      update: {},
      where: { guildID: guild.id },
    });
  } catch (err) {
    logger.error(REPOSITORY_MESSAGES.failedToEnsureGuild(guild.id, err));
    throw new EphemeralError(REPOSITORY_MESSAGES.UNABLE_TO_ACCESS_GUILD_DATA);
  }
}

export async function getAllGuilds(): Promise<GuildModel[]> {
  return prisma.guild.findMany();
}

// Function that enables or disables commands for a guild in the database
export async function setCommandsEnabled(
  guildID: string,
  enabled: boolean,
): Promise<void> {
  await prisma.guild.update({
    data: { commandsEnabled: enabled },
    where: { guildID },
  });
}
