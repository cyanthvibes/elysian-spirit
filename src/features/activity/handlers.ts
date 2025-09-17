import {
  ensureMembers,
  getInactiveMembers,
} from "database/repositories/members/memberRepository.js";
import {
  ChatInputCommandInteraction,
  Collection,
  ContainerBuilder,
  GuildMember,
  MessageFlags,
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

  // Get the number of days specified by the member
  const days: number =
    interaction.options.getInteger("days") ?? DEFAULT_INACTIVITY_DAYS;

  // Get members to check inactivity for specified by the member
  const rawInput: string = interaction.options.getString("member") ?? "";

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
  const members: Collection<string, GuildMember> = (
    await interaction.guild.members.fetch()
  ).filter((member: GuildMember): boolean => !member.user.bot);

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

  const inactiveMemberIDs: string[] = inactiveMembers.map(
    (member: { discordID: string }): string => member.discordID,
  );

  if (subcommand === "check") {
    const containers: ContainerBuilder[] = buildInactivityCheckContainers(
      inactiveMemberIDs,
      days,
    );

    await sendInteractionContainers(interaction, containers, false);
  } else if (subcommand === "de-rank") {
    let membersToDeRank: string[] = inactiveMemberIDs;

    // If members were specified
    if (rawInput) {
      // Parse provided mentions
      const specifiedMemberIDs: string[] = await parseMemberMentions(
        interaction.guild,
        rawInput,
      );

      // Only de-rank inactive members that were specified by the member
      membersToDeRank = inactiveMemberIDs.filter((memberID: string): boolean =>
        specifiedMemberIDs.includes(memberID),
      );
    }

    // Otherwise, de-rank all inactive members
    const {
      alreadyDeRanked,
      deRanked,
    }: { alreadyDeRanked: string[]; deRanked: string[] } = await deRankMembers(
      interaction.guild,
      membersToDeRank,
    );

    const containers: ContainerBuilder[] = buildInactivityDeRankContainers(
      deRanked,
      alreadyDeRanked,
      days,
    );

    await sendInteractionContainers(interaction, containers, false);
  }
}
