import { EMOJIS } from "constants/emojis.js";

export const REPOSITORY_MESSAGES = {
  failedToEnsureGuild: (guildID: string, err: unknown): string =>
    [
      `${EMOJIS.ERROR} Failed to ensure guild ${guildID} exists:`,
      `${err}`,
    ].join("\n"),

  failedToEnsureMembers: (err: unknown): string =>
    [`Error ensuring members:`, `${err}`].join("\n"),

  failedToFetchMembers: (err: unknown): string =>
    [`${EMOJIS.ERROR} Error fetching inactive members:`, `${err}`].join("\n"),

  TRANSACTION_HAS_ALREADY_BEEN_UNDONE: `${EMOJIS.ERROR} Transaction has already been undone.`,
  TRANSACTION_NOT_FOUND: `${EMOJIS.ERROR} Transaction not found.`,
  UNABLE_TO_ACCESS_GUILD_DATA: `${EMOJIS.ERROR} Unable to access guild data. Please try again later.`,
  UNABLE_TO_ACCESS_MEMBER_DATA: `${EMOJIS.ERROR} Unable to access member data. Please try again later.`,
  UNABLE_TO_GET_TRANSACTIONS: `${EMOJIS.ERROR} Unable to get clan point transactions. Please try again later.`,
  UNABLE_TO_GET_UNDO_MEMBERS: `${EMOJIS.ERROR} Could not find or create the member performing the undo action.`,
  UNABLE_TO_MODIFY_CLAN_POINTS: `${EMOJIS.ERROR} Unable to modify clan points. Please try again later.`,
  UNABLE_TO_RETRIEVE_CLAN_POINTS: `${EMOJIS.ERROR} Unable to retrieve clan points. Please try again later.`,
  UNABLE_TO_RETRIEVE_INACTIVE_MEMBERS: `${EMOJIS.ERROR} Unable to retrieve inactive members. Please try again later.`,
  UNABLE_TO_UNDO_TRANSACTION: `${EMOJIS.ERROR} Unable to undo transaction. Please try again later.`,
  UNABLE_TO_UPDATE_MEMBER_ACTIVITY: `${EMOJIS.ERROR} Unable to update member activity. Please try again later.`,

  unableToFetchTransactions: (err: unknown): string =>
    [`${EMOJIS.ERROR} Error fetching clan point transactions:`, `${err}`].join(
      "\n",
    ),

  unableToModifyClanPoints: (err: unknown): string =>
    [`${EMOJIS.ERROR} Error modifying clan points:`, `${err}`].join("\n"),

  unableToRetrieveClanPoints: (err: unknown): string =>
    [`${EMOJIS.ERROR} Error retrieving clan points:`, `${err}`].join("\n"),

  unableToUndoTransactions: (err: unknown): string =>
    [`${EMOJIS.ERROR} Error undoing transaction:`, `${err}`].join("\n"),

  unableToUpdateMemberActivity: (err: unknown): string =>
    [`${EMOJIS.ERROR} Error updating last message sent at:`, `${err}`].join(
      "\n",
    ),
} as const;
