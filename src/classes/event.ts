import { ElysianSpirit } from "classes/client.js";
import { ClientEvents, Events } from "discord.js";
import { ZodValidationResult } from "types/zodValidation.js";
import { z } from "zod/v4";

// Define a schema using Zod to validate required properties of an event
const eventSchema = z.object({
  execute: z.function({
    input: [z.instanceof(ElysianSpirit), z.unknown()],
    output: z.void(),
  }),
  name: z.enum(Object.values(Events) as [keyof typeof Events, ...string[]]),
  once: z.boolean().optional(),
});

// Base class for all events
export abstract class Event<T extends keyof ClientEvents> {
  name: T;
  once: boolean;

  protected constructor(name: T, once = false) {
    this.name = name;
    this.once = once;
  }

  abstract execute(client: ElysianSpirit, ...args: ClientEvents[T]): void;

  // Validate event configuration using Zod schema
  validate(): ZodValidationResult {
    const validationResult = eventSchema.safeParse(this);

    if (!validationResult.success) {
      return { error: { errors: validationResult.error.issues } };
    }
    return true;
  }
}
