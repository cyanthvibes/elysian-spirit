import { ContainerBuilder } from "discord.js";
import { UNDO_MESSAGES } from "src/features/transaction/undo/messages.js";
import { ContainerStyle } from "types/container.js";
import { createSimpleContainers } from "utils/containers/containersBuilder.js";

export function buildUndoContainers(results: string): ContainerBuilder[] {
  return createSimpleContainers(
    ContainerStyle.SUCCESS,
    UNDO_MESSAGES.undoneLine(results),
  );
}
