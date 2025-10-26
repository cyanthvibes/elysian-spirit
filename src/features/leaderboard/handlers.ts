import {
  getAllTimeClanPointsLeaderboard,
  getPeriodClanPointsLeaderboard,
} from "database/repositories/clanPoints/leaderboardRepository.js";
import {
  ChatInputCommandInteraction,
  ContainerBuilder,
  MessageFlags,
} from "discord.js";
import { DateTime } from "luxon";
import { buildClanPointsLeaderboardContainers } from "src/features/leaderboard/messageBuilder.js";
import { LEADERBOARD_MESSAGES } from "src/features/leaderboard/messages.js";
import { ContainerStyle } from "types/container.js";
import { createSimpleContainers } from "utils/containers/containersBuilder.js";
import { sendInteractionContainers } from "utils/containers/containersUtils.js";

// Function that handles /leaderboard clan-points
export async function handleClanPointsLeaderboardInteraction(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!interaction.guild) return;

  const guild = interaction.guild;

  await interaction.reply({
    components: createSimpleContainers(
      ContainerStyle.INFO,
      LEADERBOARD_MESSAGES.FETCHING,
    ),
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
  });

  // Get the period for the leaderboard from the interaction arguments
  const period: string = interaction.options.getString("period", true);

  // The Discord ID of the member invoking the command
  const memberID: string = interaction.user.id;

  // Create an empty list that holds the leaderboard
  let leaderboard: { discordID: null | string; points: null | number }[] = [];

  // Create an empty title string
  let title = "";

  // If the period is "all-time", use member balances
  if (period === "all-time") {
    // Get the leaderboard
    leaderboard = await getAllTimeClanPointsLeaderboard(guild);

    // Only keep members who are still in the server
    leaderboard = leaderboard.filter(
      (entry: {
        discordID: null | string;
        points: null | number;
      }): "" | boolean | null =>
        entry.discordID && guild.members.cache.has(entry.discordID),
    );

    // Set the title
    title = LEADERBOARD_MESSAGES.title("");

    // If the period is "yearly" or "monthly", use the sum of transactions
  } else if (period === "yearly" || period === "monthly") {
    // Get "now"
    const now: DateTime<true> = DateTime.now();

    // Calculate the starting date: the start of the current year
    // or the start of the current month
    const from: DateTime<true> =
      period === "yearly" ? now.startOf("year") : now.startOf("month");

    // Calculate the ending date: the start of the current year
    // or the start of the current month
    const to: DateTime<true> =
      period === "yearly"
        ? now.endOf("year").plus({ days: 1 })
        : now.endOf("month").plus({ days: 1 });

    leaderboard = await getPeriodClanPointsLeaderboard(
      guild,
      from.toJSDate(),
      to.toJSDate(),
    );

    // Set the title
    title = LEADERBOARD_MESSAGES.title(period);
  }

  const limit = 10;

  // Set an empty list of leaderboard entries to display (top N plus ties)
  const displayList: typeof leaderboard = [];

  // The clan points value at the cutoff
  // This is used to include all ties at the cutoff
  let cutoffPoints: null | number = null;

  // For every entry of the leaderboard
  for (let i = 0; i < leaderboard.length; i++) {
    // If within the display limit
    if (i < limit) {
      // Add to the display list
      displayList.push(leaderboard[i]);

      // If at the cutoff index
      if (i === limit - 1) {
        // Set the cutoff points
        cutoffPoints = leaderboard[i].points;
      }

      // If cutoff points is set and this entry is tied at the cutoff
    } else if (
      cutoffPoints !== null &&
      leaderboard[i].points === cutoffPoints
    ) {
      // Add to the display list
      displayList.push(leaderboard[i]);

      // Stop if past the cutoff point
    } else {
      break;
    }
  }

  let lastPoints: null | number = null;
  let lastPlacement = 0;
  const placementMap = new Map<string, number | undefined>();

  // For every entry of the leaderboard
  for (let i = 0, shown = 0; i < leaderboard.length; i++) {
    // Get the current entry
    const entry: { discordID: null | string; points: null | number } =
      leaderboard[i];

    // Skip if no Discord ID
    if (!entry.discordID) continue;

    let placement: number;

    // If tied with previous entry
    if (entry.points === lastPoints) {
      // Use the same placement
      placement = lastPlacement;

      // If not tied
    } else {
      // Increment placement and update placement and points
      placement = shown + 1;
      lastPlacement = placement;
      lastPoints = entry.points;
    }

    // Map Discord ID to placement
    placementMap.set(entry.discordID, placement);

    // Increment shown entries count
    shown++;
  }

  // Set an empty string for the leaderboard entries
  let entries = "";

  // For every entry to be displayed
  for (const entry of displayList) {
    // If the entry is valid
    if (entry.discordID && entry.points) {
      // Add formatted entry to the string
      entries += LEADERBOARD_MESSAGES.entry(
        placementMap.get(entry.discordID) as number,
        entry.discordID,
        entry.points,
      );
    }
  }

  // Set empty string for the member's placement if they are outside the top 10
  let memberPlacementOutsideTop10 = "";

  // Get the member's placement
  const placement: number | undefined = placementMap.get(memberID);

  // Find the member's entry
  const memberPoints: null | number | undefined = leaderboard.find(
    (entry: { discordID: null | string; points: null | number }): boolean =>
      entry.discordID === memberID,
  )?.points;

  // Check if the member is in the display list
  const inDisplay: boolean = displayList.some(
    (entry: { discordID: null | string; points: null | number }): boolean =>
      entry.discordID === memberID,
  );

  // If the member is not in the top 10 but has a placement
  if (placement && !inDisplay && memberPoints) {
    // Add formatted placement to the string
    memberPlacementOutsideTop10 = LEADERBOARD_MESSAGES.memberPlacement(
      placement,
      memberID,
      memberPoints,
    );
  }

  const containers: ContainerBuilder[] = buildClanPointsLeaderboardContainers(
    title,
    entries,
    memberPlacementOutsideTop10,
  );

  await sendInteractionContainers(interaction, containers, true);
}
