import { ActionType } from "src/generated/prisma/enums.js";

export interface AddOrRemoveContainersParams {
  actionType: ActionType;
  allowedArray: string[];
  amount: number;
  guildID: string;
  reason: string;
  skippedArray: string[];
  startingBalances: Map<string, number>;
  transactionID: string;
}
