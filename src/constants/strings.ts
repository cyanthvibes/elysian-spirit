import { inlineCode, subtext } from "discord.js";

// Helper function to create the transaction ID string
export const createTransactionIDLine: (transactionID: string) => string = (
  transactionID: string,
): string => `${subtext(`Transaction ID: ${inlineCode(transactionID)}`)}`;
