import { DAILY_CLAN_POINTS } from "constants/clanPoints.js";
import { modifyClanPoints } from "database/repositories/clanPoints/actionRepository.js";
import { ensureMembers } from "database/repositories/members/memberRepository.js";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { DateTime } from "luxon";
import { DAILY_MESSAGES } from "src/features/daily/messages.js";
import {
  canClaimDailyPoints,
  getNextEligibleClaimTime,
} from "src/features/daily/utils.js";
import { ActionType } from "src/generated/prisma/enums.js";
import { ContainerStyle } from "types/container.js";
import { createSimpleContainers } from "utils/containers/containersBuilder.js";

// Function that handles /daily
export async function handleDailyInteraction(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!interaction.guild) return;

  await interaction.reply({
    components: createSimpleContainers(
      ContainerStyle.INFO,
      DAILY_MESSAGES.CHECKING,
    ),
    flags: MessageFlags.IsComponentsV2,
  });

  // Ensure that the member exists in the database and get the member
  const [member] = await ensureMembers(interaction.guild, [
    interaction.user.id,
  ]);

  // Get timestamp when member last claimed daily clan points
  const lastClaimed: DateTime<false> | DateTime<true> | null =
    member.clanPointsLastClaimedAt
      ? DateTime.fromJSDate(member.clanPointsLastClaimedAt)
      : null;

  // Get timestamp for "now"
  const now: DateTime<true> = DateTime.now();

  // If the member is not eligible for daily clan points
  if (!canClaimDailyPoints(lastClaimed, now)) {
    // Get timestamp for when the member can claim daily clan points again
    const nextEligible: DateTime<boolean> = getNextEligibleClaimTime(
      lastClaimed,
      now,
    );

    const timestamp: number = Math.floor(nextEligible.toSeconds());

    const hoursUntilNextClaim: number = Math.ceil(
      nextEligible.diff(now.setZone("Europe/London"), "hours").hours,
    );

    await interaction.editReply({
      components: createSimpleContainers(
        ContainerStyle.ERROR,
        DAILY_MESSAGES.error(hoursUntilNextClaim, timestamp),
      ),
      flags: MessageFlags.IsComponentsV2,
    });

    return;
  }

  // If the member is eligible, modify clan points accordingly
  const { finalBalances } = await modifyClanPoints(
    interaction.guild,
    ActionType.DAILY,
    [interaction.user.id],
    DAILY_CLAN_POINTS,
    "Daily clan point claim",
    interaction.user.id,
  );

  // Get the new balance for the member
  const newBalance: number | undefined = finalBalances.get(interaction.user.id);

  await interaction.editReply({
    components: createSimpleContainers(
      ContainerStyle.SUCCESS,
      DAILY_MESSAGES.success(DAILY_CLAN_POINTS, newBalance),
    ),
    flags: MessageFlags.IsComponentsV2,
  });
}
