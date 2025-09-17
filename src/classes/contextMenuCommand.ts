import { ElysianSpirit } from "classes/client.js";
import {
  ChannelIDs,
  getChannelIDs,
  getRoleIDs,
  resolveIDs,
  RoleIDs,
} from "config/configUtils.js";
import { CHANNEL_KEY } from "constants/channels.js";
import { ROLE_KEY } from "constants/roles.js";
import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  ContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
} from "discord.js";
import { ZodValidationResult } from "types/zodValidation.js";
import { checkInteractionPermissions } from "utils/permissionsUtils.js";
import { z } from "zod/v4";

export type SupportedInteractions =
  | MessageContextMenuCommandInteraction
  | UserContextMenuCommandInteraction;

// Type guard to validate ContextMenuCommandInteraction instances
const isSupportedContextMenuInteraction: (
  val: unknown,
) => val is SupportedInteractions = (
  val: unknown,
): val is SupportedInteractions => val instanceof ContextMenuCommandInteraction;

// Define a schema using Zod to validate required properties of a context-menu command
const contextMenuCommandSchema = z.object({
  description: z.string().min(1),
  execute: z
    .function()
    .input([
      z.instanceof(ElysianSpirit),
      z.custom(isSupportedContextMenuInteraction),
    ])
    .output(z.promise(z.void())),
  isPrivileged: z.boolean(),
  name: z.string().min(1),
  type: z.union([
    z.literal(ApplicationCommandType.User),
    z.literal(ApplicationCommandType.Message),
  ]),
});

// Base class for all context-menu commands
export abstract class ContextMenuCommand {
  allowedChannelIDs: string[] = [];
  allowedChannelKeys: CHANNEL_KEY[] = [];
  data: ContextMenuCommandBuilder;
  description: string;
  isPrivileged: boolean;
  requiredRoleKeys: ROLE_KEY[] = [];
  requiredRolesIDs: string[] = [];

  protected constructor(description: string, isPrivileged = false) {
    this.data = new ContextMenuCommandBuilder();
    this.description = description;
    this.isPrivileged = isPrivileged;
  }

  // This checks if the member has the required roles and if the command is used in the right channel
  async checkPermissions(
    interaction: ContextMenuCommandInteraction,
  ): Promise<void> {
    if (!interaction.guild) return;

    const guildID: string = interaction.guild.id;

    const roleMap: RoleIDs = getRoleIDs(guildID);
    const channelMap: ChannelIDs = getChannelIDs(guildID);

    this.allowedChannelIDs = resolveIDs(this.allowedChannelKeys, channelMap);
    this.requiredRolesIDs = resolveIDs(this.requiredRoleKeys, roleMap);

    await checkInteractionPermissions(
      interaction,
      this.requiredRolesIDs,
      this.allowedChannelIDs,
      roleMap,
      this,
    );
  }

  abstract execute(
    client: ElysianSpirit,
    interaction: SupportedInteractions,
  ): Promise<void>;

  // Validate context-menu command configuration using Zod schema
  validate(): ZodValidationResult {
    const validationResult = contextMenuCommandSchema.safeParse({
      description: this.description,
      execute: this.execute,
      isPrivileged: this.isPrivileged,
      name: this.data.name,
      type: this.data.type,
    });

    if (!validationResult.success) {
      return { error: { errors: validationResult.error.issues } };
    }
    return true;
  }
}
