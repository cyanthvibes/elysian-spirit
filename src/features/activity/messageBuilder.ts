import { ContainerBuilder, userMention } from "discord.js";
import { ACTIVITY_MESSAGE } from "src/features/activity/messages.js";
import { ContainerStyle, MessageBlock } from "types/container.js";
import { buildContainers } from "utils/containers/containersBuilder.js";
import {
  createContentBlock,
  createMainHeader,
} from "utils/containers/containersUtils.js";

// Function that builds the /inactivity check containers
export function buildInactivityCheckContainers(
  inactiveMemberIDs: string[],
  days: number,
): ContainerBuilder[] {
  const blocks: MessageBlock[] = [];

  // Only return a main header block if no inactive members were found
  if (inactiveMemberIDs.length === 0) {
    blocks.push(createMainHeader(ACTIVITY_MESSAGE.NO_INACTIVE_MEMBERS_FOUND));

    // Otherwise, return a main header and content block
  } else {
    blocks.push(
      createMainHeader(
        ACTIVITY_MESSAGE.inactiveMembers(inactiveMemberIDs.length, days),
      ),
    );

    blocks.push(
      createContentBlock(
        inactiveMemberIDs.map(
          (memberID: string): string => `- ${userMention(memberID)}`,
        ),
      ),
    );
  }

  return buildContainers(ContainerStyle.SUCCESS, blocks);
}

// Function that builds the /inactivity de-rank containers
export function buildInactivityDeRankContainers(
  deRanked: string[],
  alreadyDeRanked: string[],
  days: number,
): ContainerBuilder[] {
  const blocks: MessageBlock[] = [];

  // If no members are de-ranked and if no members were already de-ranked, only return a main header block
  if (deRanked.length === 0 && alreadyDeRanked.length === 0) {
    blocks.push(createMainHeader(ACTIVITY_MESSAGE.NO_MEMBERS_FOUND_TO_DERANK));

    // Otherwise, set a different main header block
  } else {
    blocks.push(
      createMainHeader(ACTIVITY_MESSAGE.deRankMembers(deRanked.length, days)),
    );
  }

  // If there are members who got de-ranked, add a content block
  if (deRanked.length > 0) {
    blocks.push(
      createContentBlock(
        deRanked.map(
          (memberID: string): string => `- ${userMention(memberID)}`,
        ),
        ACTIVITY_MESSAGE.deRankedMembers(deRanked.length),
      ),
    );
  }

  // If there are members who were already de-ranked, add a content block
  if (alreadyDeRanked.length > 0) {
    blocks.push(
      createContentBlock(
        alreadyDeRanked.map(
          (memberID: string): string => `- ${userMention(memberID)}`,
        ),
        ACTIVITY_MESSAGE.alreadyDeRankedMembers(alreadyDeRanked.length),
      ),
    );
  }

  return buildContainers(ContainerStyle.SUCCESS, blocks);
}
