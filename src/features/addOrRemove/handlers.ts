import {
  DEFAULT_ADD_REASON,
  DEFAULT_REMOVE_REASON,
} from "constants/clanPoints.js";
import { ROLE_KEYS } from "constants/roles.js";
import { modifyClanPoints } from "database/repositories/clanPoints/actionRepository.js";
import {
  ChatInputCommandInteraction,
  ContainerBuilder,
  MessageFlags,
} from "discord.js";
import { buildAddOrRemoveContainers } from "src/features/addOrRemove/messageBuilder.js";
import { ADD_OR_REMOVE_MESSAGES } from "src/features/addOrRemove/messages.js";
import { AddOrRemoveContainersParams } from "src/features/addOrRemove/types.js";
import { ActionType } from "src/generated/prisma/enums.js";
import { ContainerStyle } from "types/container.js";
import { createSimpleContainers } from "utils/containers/containersBuilder.js";
import { sendInteractionContainers } from "utils/containers/containersUtils.js";
import { EphemeralError } from "utils/errorUtils.js";
import { parseMemberMentions } from "utils/parseUtils.js";
import { makeSureMembersWithPermsExist } from "utils/permissionsUtils.js";
import { filterMembersWithRole } from "utils/roleUtils.js";

interface AllowedAndSkipped {
  allowed: string[];
  skipped: string[];
}

// Function that handles /add and /remove
export async function handleAddOrRemoveInteraction(
  interaction: ChatInputCommandInteraction,
  actionType: ActionType,
): Promise<void> {
  if (!interaction.guild) return;

  // Get arguments from the interaction
  const amount: number = interaction.options.getInteger("amount", true);
  const rawInput: string = interaction.options.getString("members", true);

  const defaultReason: string =
    actionType === ActionType.ADD ? DEFAULT_ADD_REASON : DEFAULT_REMOVE_REASON;

  const reason: string =
    interaction.options.getString("reason") || defaultReason;

  // Parse @member mentions from interaction to Discord IDs
  const members: string[] = await parseMemberMentions(
    interaction.guild,
    rawInput,
  );

  // Exit early if no valid members were provided
  if (members.length === 0) {
    throw new EphemeralError(ADD_OR_REMOVE_MESSAGES.NO_VALID_MEMBERS);
  }

  // Create two arrays of Discord IDs; members with the required role and members without
  const { allowed, skipped }: AllowedAndSkipped = await filterMembersWithRole(
    interaction.guild,
    members,
    ROLE_KEYS.MEMBER_PERMS,
  );

  // Make sure at least one member has the required role
  // makeSureMembersWithPermsExist() will throw an error and the call chain will end early
  makeSureMembersWithPermsExist(allowed, skipped, actionType, interaction);

  await interaction.reply({
    components: createSimpleContainers(
      ContainerStyle.INFO,
      ADD_OR_REMOVE_MESSAGES.firstReplyHeader(
        ADD_OR_REMOVE_MESSAGES.addingOrRemoving(actionType),
        amount,
      ),
    ),
    flags: MessageFlags.IsComponentsV2,
  });

  // Modify clan points in the database
  const { startingBalances, transactionID } = await modifyClanPoints(
    interaction.guild,
    actionType,
    allowed,
    amount,
    reason,
    interaction.user.id,
  );

  const params: AddOrRemoveContainersParams = {
    actionType,
    allowedArray: allowed,
    amount,
    guildID: interaction.guild.id,
    reason,
    skippedArray: skipped,
    startingBalances: startingBalances,
    transactionID,
  };

  const containers: ContainerBuilder[] = buildAddOrRemoveContainers(params);

  await sendInteractionContainers(interaction, containers, true);
}
