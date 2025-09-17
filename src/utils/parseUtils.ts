import { Collection, Guild, GuildMember } from "discord.js";
import { ParsedDiscordName } from "src/features/spreadsheet/types.js";

const EMOJI_REGEX =
  /[\u{1F3FB}-\u{1FAFF}\u{1F300}-\u{1F6FF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{3030}\u{303D}\u{3297}\u{3299}]|<a?:\w+:\d+>/gu;

const SPECIAL_CHARS_REGEX = /[.,:;!?"'`~@#$%^&*()[\]{}<>|\\/]/g;

// Function that normalises a name
export function normaliseName(name: string): string {
  return (
    name
      // Remove spaces at the beginning and end
      .trim()
      // Remove emojis
      .replace(EMOJI_REGEX, "")
      // Remove special characters
      .replace(SPECIAL_CHARS_REGEX, "")
      // Convert to lowercase
      .toLowerCase()
  );
}

// Function that splits and normalises ALT string from spreadsheet into an array of normalised names
export function parseAlts(altsString: string): string[] {
  if (!altsString.trim()) return [];

  return altsString
    .split(",")
    .map((alt: string): string => alt.trim())
    .filter(Boolean)
    .map(normaliseName)
    .filter(Boolean);
}

// Function that parses Discord display name into RSN and ALTs
export function parseDiscordName(displayName: string): ParsedDiscordName {
  // Remove nickname
  const withoutNickname: string = displayName.replace(/\(.*?\)/g, "");

  // Split up by pipe
  const parts: string[] = withoutNickname
    .split("|")
    .map((part: string): string => part.trim())
    .filter(Boolean);

  return {
    alts: parts.slice(1).map(normaliseName).filter(Boolean),
    rsn: parts[0] ? normaliseName(parts[0]) : "",
  } as ParsedDiscordName;
}

// Extracts and returns member IDs from a string of raw mentions that correspond to humans members (not bots)
export async function parseMemberMentions(
  guild: Guild,
  rawInput: string,
): Promise<string[]> {
  // Extract member IDs from mention patterns using RegExp
  const memberIDs: string[] = Array.from(
    rawInput.matchAll(/<@!?(\d{17,20})>/g),
    (match: RegExpExecArray): string => match[1],
  );

  if (memberIDs.length === 0) return [];

  const uniqueMemberIDs: string[] = [...new Set(memberIDs)];

  try {
    // Get all members from a guild
    const members: Collection<string, GuildMember> = await guild.members.fetch({
      user: uniqueMemberIDs,
    });

    // Filter out bots
    const humanMembersSet = new Set(
      members
        .filter((member: GuildMember): boolean => !member.user.bot)
        .map((member: GuildMember): string => member.user.id),
    );

    //  Return only human members
    return memberIDs.filter((memberID: string): boolean =>
      humanMembersSet.has(memberID),
    );
  } catch {
    return [];
  }
}
