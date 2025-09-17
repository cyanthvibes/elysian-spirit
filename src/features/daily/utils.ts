import { TIME_ZONE } from "constants/clanPoints.js";
import { DateTime } from "luxon";

// Helper function that checks if a member is eligible for daily clan points
export function canClaimDailyPoints(
  lastClaimed: DateTime | null,
  now: DateTime,
): boolean {
  // If the member hasn't claimed at all, return true
  if (!lastClaimed) return true;

  // Get timestamps for "now" and for the last claim
  const nowLondon: DateTime = now.setZone(TIME_ZONE);
  const lastClaimedAt: DateTime = lastClaimed.setZone(TIME_ZONE);

  // Find the most recent UK noon before or equal to "now"
  const lastReset: DateTime =
    nowLondon.hour >= 12
      ? nowLondon.startOf("day").set({ hour: 12 })
      : nowLondon.minus({ days: 1 }).startOf("day").set({ hour: 12 });

  // Member can claim if they last claimed before the reset time
  return lastClaimedAt < lastReset;
}

// Returns the next eligible claim time for a member, given their last claim and "now"
export function getNextEligibleClaimTime(
  lastClaimed: DateTime | null,
  now: DateTime,
): DateTime {
  const nowLondon: DateTime<false> | DateTime<true> = now.setZone(TIME_ZONE);
  const lastClaimedAt: DateTime<false> | DateTime<true> | null = lastClaimed
    ? lastClaimed.setZone(TIME_ZONE)
    : null;

  // Find the most recent UK noon before or equal to "now"
  const lastReset: DateTime<false> | DateTime<true> =
    nowLondon.hour >= 12
      ? nowLondon.startOf("day").set({ hour: 12 })
      : nowLondon.minus({ days: 1 }).startOf("day").set({ hour: 12 });

  // If member hasn't claimed or last claimed before last reset, eligible now
  if (!lastClaimedAt || lastClaimedAt < lastReset) {
    return nowLondon;
  }

  // Otherwise, next eligible is next UK noon after "now"
  return nowLondon.hour < 12
    ? nowLondon.startOf("day").set({ hour: 12 })
    : nowLondon.plus({ days: 1 }).startOf("day").set({ hour: 12 });
}
