import { ContainerBuilder } from "discord.js";
import { ContainerStyle, MessageBlock } from "types/container.js";
import { buildContainers } from "utils/containers/containersBuilder.js";
import {
  createContentBlock,
  createMainHeader,
} from "utils/containers/containersUtils.js";

export function buildClanPointsLeaderboardContainers(
  title: string,
  entries: string,
  memberPlacement: string,
): ContainerBuilder[] {
  const blocks: MessageBlock[] = [];

  // Create the header block
  blocks.push(createMainHeader(title));

  // Create the content block
  blocks.push(createContentBlock([entries]));

  // Add an extra content block if the member who used the command isn't in the top 10
  if (memberPlacement) {
    blocks.push(createContentBlock([memberPlacement]));
  }

  return buildContainers(ContainerStyle.SUCCESS, blocks);
}
