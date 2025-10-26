import { ContainerBuilder, userMention } from "discord.js";
import { ADD_OR_REMOVE_MESSAGES } from "src/features/addOrRemove/messages.js";
import { AddOrRemoveContainersParams } from "src/features/addOrRemove/types.js";
import { calculateNewBalance } from "src/features/balance/utils.js";
import { ContainerStyle, MessageBlock } from "types/container.js";
import { buildContainers } from "utils/containers/containersBuilder.js";
import {
  createContentBlock,
  createFooterBlock,
  createMainHeader,
} from "utils/containers/containersUtils.js";

// Function that builds the containers for /add and /remove
export function buildAddOrRemoveContainers({
  actionType,
  allowedArray,
  amount,
  guildID,
  reason,
  skippedArray,
  startingBalances,
  transactionID,
}: AddOrRemoveContainersParams): ContainerBuilder[] {
  // Create strings for messaging
  const fromOrTo: string = ADD_OR_REMOVE_MESSAGES.fromOrTo(actionType);

  const addingOrRemoving: string =
    ADD_OR_REMOVE_MESSAGES.addingOrRemoving(actionType);

  const addedOrRemoved: string =
    ADD_OR_REMOVE_MESSAGES.addedOrRemoved(actionType);

  const uniqueAllowedCount: number = new Set(allowedArray).size;

  const headerText: string = ADD_OR_REMOVE_MESSAGES.mainHeader(
    addingOrRemoving,
    amount,
    fromOrTo,
    uniqueAllowedCount,
    reason,
  );

  const blocks: MessageBlock[] = [];

  // Add the header
  blocks.push(createMainHeader(headerText));

  const runningBalances = new Map(startingBalances);

  // Add a content block if there are members who will have their balance modified
  if (allowedArray.length > 0) {
    blocks.push(
      createContentBlock(
        allowedArray.map((memberID: string): string => {
          const currentBalance: number = runningBalances.get(memberID) ?? 0;
          const newBalance: number = calculateNewBalance(
            actionType,
            currentBalance,
            amount,
          );
          runningBalances.set(memberID, newBalance);

          return ADD_OR_REMOVE_MESSAGES.contentBlockContent(
            addedOrRemoved,
            amount,
            fromOrTo,
            memberID,
            newBalance,
          );
        }),
      ),
    );
  }

  // Add a content block if there are members who will be skipped
  if (skippedArray.length > 0) {
    blocks.push(
      createContentBlock(
        skippedArray.map((id: string): string => `- ${userMention(id)}`),
        ADD_OR_REMOVE_MESSAGES.skipped(skippedArray, guildID),
      ),
    );
  }

  blocks.push(createFooterBlock(transactionID));

  return buildContainers(ContainerStyle.SUCCESS, blocks);
}
