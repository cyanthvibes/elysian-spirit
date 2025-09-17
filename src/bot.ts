import { ElysianSpirit } from "classes/client.js";

// IIFE to initialise the bot
(async (): Promise<void> => {
  // Create a new instance of our Elysian Spirit bot and call init()
  await new ElysianSpirit().init();
})();
