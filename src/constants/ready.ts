import { ActivityType, PresenceData } from "discord.js";

export interface Presence {
  activity: string;
  state?: string;
  status?: PresenceData["status"];
  type: ActivityType;
  url?: string;
}

export const PRESENCE_INTERVAL_MS: number = 10 * 1000; // 10 seconds

export const PRESENCES: Presence[] = [
  {
    activity: "Use /help for more information",
    status: "idle",
    type: ActivityType.Custom,
  },
  {
    activity: "Bot busting",
    type: ActivityType.Streaming,
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
];
