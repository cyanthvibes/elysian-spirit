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
import { Message } from "discord.js";
import { ZodValidationResult } from "types/zodValidation.js";
import { checkMessageCommandPermissions } from "utils/permissionsUtils.js";
import z from "zod/v4";

// Type guard to validate Message instances
const isMessage: (val: unknown) => val is Message = (
  val: unknown,
): val is Message => val instanceof Message;

// Define a schema using Zod to validate required properties of a message command
const messageCommandSchema = z.object({
  description: z.string().min(1),
  execute: z.function({
    input: [
      z.instanceof(ElysianSpirit),
      z.custom(isMessage),
      z.array(z.string()),
    ],
    output: z.promise(z.void()),
  }),
  isPrivileged: z.boolean(),
  name: z.string().min(1),
});

export interface MessageCommandOptions {
  allowedChannelKeys: CHANNEL_KEY[];
  description: string;
  isPrivileged: boolean;
  name: string;
  ownerOnly: boolean;
  requiredRoleKeys: ROLE_KEY[];
}

// Base class for all message-based commands
export abstract class MessageCommand {
  allowedChannelIDs: string[] = [];
  allowedChannelKeys: CHANNEL_KEY[];
  description: string;
  isPrivileged: boolean;
  name: string;
  ownerOnly: boolean;
  requiredRoleKeys: ROLE_KEY[];
  requiredRolesIDs: string[] = [];

  protected constructor(options: MessageCommandOptions) {
    this.name = options.name;
    this.description = options.description;
    this.allowedChannelKeys = options.allowedChannelKeys || [];
    this.requiredRoleKeys = options.requiredRoleKeys || [];
    this.ownerOnly = options.ownerOnly || false;
    this.isPrivileged = options.isPrivileged || false;
  }

  // This checks if the member has the required roles and if the command is used in the right channel
  async checkPermissions(message: Message): Promise<void> {
    const guildID: string | undefined = message.guild?.id;
    const roleMap: RoleIDs = guildID ? getRoleIDs(guildID) : ({} as RoleIDs);
    const channelMap: ChannelIDs = guildID
      ? getChannelIDs(guildID)
      : ({} as ChannelIDs);

    this.allowedChannelIDs = resolveIDs(this.allowedChannelKeys, channelMap);
    this.requiredRolesIDs = resolveIDs(this.requiredRoleKeys, roleMap);

    checkMessageCommandPermissions(
      message,
      this.requiredRolesIDs,
      this.allowedChannelIDs,
      roleMap,
      this.ownerOnly,
    );
  }

  abstract execute(
    client: ElysianSpirit,
    message: Message,
    args: string[],
  ): Promise<void>;

  validate(): ZodValidationResult {
    const validationResult = messageCommandSchema.safeParse({
      description: this.description,
      execute: this.execute,
      isPrivileged: this.isPrivileged,
      name: this.name,
    });

    if (!validationResult.success) {
      return { error: { errors: validationResult.error.issues } };
    }
    return true;
  }
}
