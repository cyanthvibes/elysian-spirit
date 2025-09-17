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
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { ZodValidationResult } from "types/zodValidation.js";
import { checkInteractionPermissions } from "utils/permissionsUtils.js";
import { z } from "zod/v4";

// Type guard to validate ChatInputCommandInteraction instances
const isChatInputCommandInteraction: (
  val: unknown,
) => val is ChatInputCommandInteraction = (
  val: unknown,
): val is ChatInputCommandInteraction =>
  val instanceof ChatInputCommandInteraction;

// Type guard to validate AutocompleteInteraction instances
const isAutoCompleteInteraction: (
  val: unknown,
) => val is AutocompleteInteraction = (
  val: unknown,
): val is AutocompleteInteraction => val instanceof AutocompleteInteraction;

// Define a schema using Zod to validate required properties of a slash command
const slashCommandSchema = z.object({
  autocomplete: z
    .function({
      input: [z.instanceof(ElysianSpirit), z.custom(isAutoCompleteInteraction)],
      output: z.promise(z.void()),
    })
    .optional(),
  description: z.string().min(1),
  execute: z.function({
    input: [
      z.instanceof(ElysianSpirit),
      z.custom(isChatInputCommandInteraction),
    ],
    output: z.promise(z.void()),
  }),
  isPrivileged: z.boolean(),
  name: z.string().min(1),
});

// Base class for all slash commands
export abstract class SlashCommand {
  allowedChannelIDs: string[] = [];
  allowedChannelKeys: CHANNEL_KEY[] = [];
  data: SlashCommandBuilder;
  isPrivileged: boolean;
  requiredRoleKeys: ROLE_KEY[] = [];
  requiredRolesIDs: string[] = [];

  protected constructor(isPrivileged = false) {
    this.data = new SlashCommandBuilder();
    this.isPrivileged = isPrivileged;
  }

  abstract autocomplete(
    client: ElysianSpirit,
    interaction: AutocompleteInteraction,
  ): Promise<void>;

  // This checks if the member has the required roles and if the command is used in the right channel
  async checkPermissions(
    interaction: ChatInputCommandInteraction,
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
    interaction: ChatInputCommandInteraction,
  ): Promise<void>;

  // Validate slash command configuration using Zod schema
  validate(): ZodValidationResult {
    const validationResult = slashCommandSchema.safeParse({
      description: this.data.description,
      execute: this.execute,
      isPrivileged: this.isPrivileged,
      name: this.data.name,
    });

    if (!validationResult.success) {
      return { error: { errors: validationResult.error.issues } };
    }
    return true;
  }
}
