export const REGISTER_COMMANDS_MESSAGES = {
  CLEARING_GLOBAL_COMMANDS: "Clearing global commands...",
  CLEARING_GLOBAL_COMMANDS_SUCCESSFUL: "Successfully cleared global commands",

  clearingGuildCommands: (guildID: string): string =>
    `Clearing guild commands for guild ${guildID}...`,

  clearingGuildCommandsSuccessful: (guildID: string): string =>
    `Successfully cleared guild commands for guild ${guildID}`,

  errorClearingGlobalCommands: (err: unknown): string =>
    `Error clearing global commands:\n${err}`,

  errorClearingGuildCommands: (guildID: string, err: unknown): string =>
    `Error clearing guild commands for guild ${guildID}:\n${err}`,

  errorDuringRegistration: (err: unknown): string =>
    `Unexpected error during registration:\n${err}`,
  errorRegisteringGlobalCommands: (err: unknown): string =>
    `Error registering global commands:\n${err}`,

  errorRegisteringGuildCommands: (guildID: string, err: unknown): string =>
    `Error registering guild commands for guild ${guildID}:\n${err}`,

  INVALID_FIRST_ARGUMENT:
    'Please specify "guild" or "global" as the first argument',
  INVALID_SECOND_ARGUMENT:
    'Second argument must be "clear" or omitted to register commands',
  REGISTERING_GLOBAL_COMMANDS: "Registering global commands...",
  REGISTERING_GLOBAL_COMMANDS_SUCCESSFUL:
    "Successfully registered global commands",

  registeringGuildCommands: (guildID: string): string =>
    `Registering guild commands for guild ${guildID}...`,

  registeringGuildCommandsSuccessful: (guildID: string): string =>
    `Successfully registered guild commands for guild ${guildID}`,

  TEST_GUILD_ID_MISSING:
    "TEST_GUILD_ID must be set in environment or config for guild scope",
} as const;
