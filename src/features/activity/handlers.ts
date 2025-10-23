import { getRoleID } from "config/configUtils.js";
import { ROLE_KEYS } from "constants/roles.js";
import {
  ensureMembers,
  getInactiveMembers,
} from "database/repositories/members/memberRepository.js";
import {
  APIRole,
  ChatInputCommandInteraction,
  Collection,
  ContainerBuilder,
  GuildMember,
  MessageFlags,
  Role,
} from "discord.js";
import { DEFAULT_INACTIVITY_DAYS } from "src/features/activity/constants.js";
import {
  buildInactivityCheckContainers,
  buildInactivityDeRankContainers,
} from "src/features/activity/messageBuilder.js";
import { ACTIVITY_MESSAGE } from "src/features/activity/messages.js";
import { deRankMembers } from "src/features/activity/utils.js";
import { ContainerStyle } from "types/container.js";
import { createSimpleContainers } from "utils/containers/containersBuilder.js";
import { sendInteractionContainers } from "utils/containers/containersUtils.js";
import { parseMemberMentions } from "utils/parseUtils.js";

// Function that handles /inactivity check and /inactivity de-rank
export async function handleInactivityInteraction(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!interaction.guild) return;

  // Get subcommand from interaction
  const subcommand: string = interaction.options.getSubcommand();

  // Get the number of days
  const days: number =
    interaction.options.getInteger("days") ?? DEFAULT_INACTIVITY_DAYS;

  // Get members to de-rank
  const membersToCheck: string = interaction.options.getString("member") ?? "";

  // Get the role to check inactivity for
  const roleToCheck: APIRole | null | Role =
    interaction.options.getRole("role");

  if (subcommand === "check") {
    await interaction.reply({
      components: createSimpleContainers(
        ContainerStyle.INFO,
        ACTIVITY_MESSAGE.CHECKING,
      ),
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  } else if (subcommand === "de-rank") {
    await interaction.reply({
      components: createSimpleContainers(
        ContainerStyle.INFO,
        ACTIVITY_MESSAGE.DERANKING,
      ),
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  }

  // Get all the members from the guild
  const members: Collection<string, GuildMember> =
    interaction.guild.members.cache.filter(
      (member: GuildMember): boolean => !member.user.bot,
    );

  const discordIDs: string[] = members.map(
    (member: GuildMember): string => member.id,
  );

  // Ensure that the members exist in the database
  await ensureMembers(interaction.guild, discordIDs);

  // Get all the inactive members from the guild
  const inactiveMembers: { discordID: string }[] = await getInactiveMembers(
    interaction.guild,
    days,
  );

  // If no members were inactive
  if (inactiveMembers.length === 0) {
    await interaction.editReply({
      components: createSimpleContainers(
        ContainerStyle.INFO,
        ACTIVITY_MESSAGE.noInactiveMembers(days),
      ),
      flags: MessageFlags.IsComponentsV2,
    });

    return;
  }

  const memberRoleID: string = getRoleID(
    interaction.guild.id,
    ROLE_KEYS.MEMBER_PERMS,
  );

  // Get a map of all inactive member IDs where the member has the member perms role
  const inactiveMemberIDs: string[] = inactiveMembers
    .map(({ discordID }: { discordID: string }): null | string => {
      const member: GuildMember | undefined = members.get(discordID);
      if (
        member &&
        (roleToCheck
          ? member.roles.cache.has(roleToCheck.id)
          : member.roles.cache.has(memberRoleID))
      ) {
        return member.id;
      }
      return null;
    })
    .filter((id: null | string): id is string => id !== null);

  if (subcommand === "check") {
    const containers: ContainerBuilder[] = buildInactivityCheckContainers(
      inactiveMemberIDs,
      days,
    );

    await sendInteractionContainers(interaction, containers, true);
  } else if (subcommand === "de-rank") {
    let membersToDeRank: string[] = inactiveMemberIDs;

    // If members were specified
    if (membersToCheck) {
      // Parse provided mentions
      const specifiedMemberIDs: string[] = await parseMemberMentions(
        interaction.guild,
        membersToCheck,
      );

      // Only de-rank inactive members that were specified by the member
      membersToDeRank = inactiveMemberIDs.filter((memberID: string): boolean =>
        specifiedMemberIDs.includes(memberID),
      );
    }

    // Otherwise, de-rank all inactive members

    // The ability to return already de-ranked members is implemented,
    // but is disabled underneath.
    const {
      // alreadyDeRanked,
      deRanked,
    }: { alreadyDeRanked: string[]; deRanked: string[] } = await deRankMembers(
      interaction.guild,
      membersToDeRank,
    );

    const containers: ContainerBuilder[] = buildInactivityDeRankContainers(
      deRanked,
      [],
      // alreadyDeRanked,
      days,
    );

    await sendInteractionContainers(interaction, containers, true);
  }
}
