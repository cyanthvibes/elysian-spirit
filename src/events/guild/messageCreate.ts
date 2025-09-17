import { ElysianSpirit } from "classes/client.js";
import { Event } from "classes/event.js";
import { MessageCommand } from "classes/messageCommand.js";
import { getCommandPrefix, getGuildConfig } from "config/configUtils.js";
import { env } from "config/envLoader.js";
import { ERROR_MESSAGES } from "constants/messages/errorMessages.js";
import { Events, GuildMember, Message, MessageFlags } from "discord.js";
import { trackActivity } from "src/features/activity/utils.js";
import { ParsedDiscordName } from "src/features/spreadsheet/types.js";
import { ContainerStyle } from "types/container.js";
import { createSimpleContainers } from "utils/containers/containersBuilder.js";
import { SilentError } from "utils/errorUtils.js";
import { parseDiscordName } from "utils/parseUtils.js";

// For every message received by the bot, this event gets fired
export default class MessageCreateEvent extends Event<Events.MessageCreate> {
  constructor() {
    super(Events.MessageCreate);
  }

  async execute(client: ElysianSpirit, message: Message): Promise<void> {
    // Track activity only in guilds
    if (message.guild) {
      // Get the OSRS_CLAN_CHAT_CHANNEL ID for the guild from the config
      const osrsClanChatChannel: string | undefined = getGuildConfig(
        message.guild.id,
      ).CHANNEL_IDS.OSRS_CLAN_CHAT_CHANNEL;

      // Check if the guild has an OSRS_CLAN_CHAT_CHANNEL and if the message was sent in that channel
      if (osrsClanChatChannel && message.channel.id === osrsClanChatChannel) {
        const messageToCheck: string = message.content;

        // Extract name from the message
        const match: null | RegExpMatchArray =
          messageToCheck.match(/\*\*([^*]+)\*\*/);
        const extractedName: null | string = match ? match[1].trim() : null;

        // If a name was extracted, try to find a Discord member with the same name
        if (extractedName) {
          // Normalise and parse the extracted name
          const parsed: ParsedDiscordName = parseDiscordName(extractedName);
          const allNames: string[] = [parsed.rsn, ...parsed.alts];

          const member: GuildMember | undefined =
            message.guild.members.cache.find((member: GuildMember): boolean => {
              const memberParsed: ParsedDiscordName = parseDiscordName(
                member.displayName,
              );
              const memberNames: string[] = [
                memberParsed.rsn,
                ...memberParsed.alts,
              ];
              return memberNames.some((name: string): boolean =>
                allNames.includes(name),
              );
            });

          // If a Discord member was found, track activity
          if (member) {
            await trackActivity(message.guild, member.id);
          }
        }

        // Otherwise, either the guild doesn't have that channel,
        // or the message wasn't sent in that channel,
        // so the message was sent in a different channel
      } else if (!message.author.bot) {
        await trackActivity(message.guild, message.author.id);
      }
    }

    // Get prefix for the guild the message was sent in
    const prefix: string = message.guild
      ? getCommandPrefix(message.guild.id)
      : env.DEFAULT_PREFIX;

    // Exit early if the message did not start with the command prefix
    if (!message.content.startsWith(prefix)) return;

    // Get command args from the message
    const args: string[] = message.content
      .slice(prefix.length)
      .trim()
      .split(/ +/);

    // Get the command name from the message
    const commandName: string | undefined = args.shift()?.toLowerCase();

    // The message did start with the prefix but did not have anything else, exit early
    if (!commandName) return;

    // Get the actual message-based command by command name
    const command: MessageCommand | undefined =
      client.messageCommands.get(commandName);

    // If no command was found, exit early
    if (!command) return;

    try {
      // Do a permission check
      await command.checkPermissions(message);

      // Then, execute the command if checks pass
      await command.execute(client, message, args);
    } catch (err) {
      const error = err as Error;
      const errorMessage: string =
        error.message || ERROR_MESSAGES.SOMETHING_WENT_WRONG;

      // Handle silent error
      if (err instanceof SilentError) {
        return;
      }

      // Exit early if no response can be sent
      if (!message.channel.isSendable()) return;

      try {
        await message.reply({
          allowedMentions: { parse: [] },
          components: createSimpleContainers(
            ContainerStyle.ERROR,
            errorMessage,
          ),
          flags: MessageFlags.IsComponentsV2,
        });
      } catch {
        /* empty */
      }
    }
  }
}
