import { $ZodIssue } from "zod/v4/core";

export interface ZodValidationError {
  error?: { errors: $ZodIssue[] };
}

export type ZodValidationResult = true | { error?: { errors: $ZodIssue[] } };
