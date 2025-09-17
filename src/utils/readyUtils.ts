import { ElysianSpirit } from "classes/client.js";
import { Presence, PRESENCE_INTERVAL_MS, PRESENCES } from "constants/ready.js";
import { Guild, PresenceData } from "discord.js";

// Function-based presence manager
let presenceInterval: NodeJS.Timeout | null = null;
let state = 0;

// Function that starts the presence interval
export async function startPresence(client: ElysianSpirit): Promise<void> {
  if (presenceInterval) return;
  await updatePresence(client);
  presenceInterval = setInterval(
    (): Promise<void> => updatePresence(client),
    PRESENCE_INTERVAL_MS,
  );
}

// Function that stops the presence interval
export function stopPresenceManager(): void {
  if (presenceInterval) {
    clearInterval(presenceInterval);
    presenceInterval = null;
  }
}

// Function that updates the presence
async function updatePresence(client: ElysianSpirit): Promise<void> {
  state = (state + 1) % PRESENCES.length;
  let currentPresence: Presence;

  // For the first presence in PRESENCES
  if (state === 0) {
    // Sum of all members in all guilds the bot is in
    const totalMembers: number = client.guilds.cache.reduce(
      (acc: number, guild: Guild): number => acc + guild.memberCount,
      0,
    );

    // Create the presence
    currentPresence = {
      ...PRESENCES[0],
      activity: `Bankstanding with ${totalMembers} people`,
    };

    // For all other presences
  } else {
    currentPresence = PRESENCES[state];
  }

  // Update the presence for the bot
  client.user?.setPresence({
    activities: [
      {
        name: currentPresence.activity,
        state: currentPresence.state,
        type: currentPresence.type,
        url: currentPresence.url,
      },
    ],
    status: (currentPresence.status ?? "online") as PresenceData["status"],
  });
}
