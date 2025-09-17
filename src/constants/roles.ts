export const ROLE_KEYS = {
  CLAN_STAFF: "CLAN_STAFF",
  GUEST: "GUEST",
  MEMBER_PERMS: "MEMBER_PERMS",
} as const;

export type ROLE_KEY = keyof typeof ROLE_KEYS;
