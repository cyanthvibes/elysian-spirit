import { ERROR_MESSAGES } from "constants/messages/errorMessages.js";
import { BALANCE_MESSAGES } from "src/features/balance/messages.js";
import { ActionType } from "src/generated/prisma/enums.js";
import { EphemeralError } from "utils/errorUtils.js";
import { logger } from "utils/logger.js";

// Helper function to calculate new balance based on ActionType
export function calculateNewBalance(
  type: ActionType,
  previous: number,
  amount: number,
): number {
  switch (type) {
    case ActionType.ADD:
    case ActionType.DAILY:
    case ActionType.TEMPLE:
      return previous + amount;
    case ActionType.REMOVE:
    case ActionType.UNDO:
      return previous - amount;
    default:
      logger.error(BALANCE_MESSAGES.invalidActionType(type));
      throw new EphemeralError(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
  }
}
