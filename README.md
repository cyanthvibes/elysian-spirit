<div align="center">
<h1>Elysian Spirit</h1>
<img src="logo.png" alt="Elysian Spirit logo" width="250">

<p>
<strong><i>
Discord bot for the Old School RuneScape (OSRS) Elysium clan.<br> 
Manage clan points manually, track member activity, reward clan points based on TempleOSRS competitions, and more.
</i></strong>

Need more information? Any questions? Feel free to DM me on Discord: [@cyanthvibes](https://discordapp.com/users/187286355435454466/)
</p>
</div>

---

## Features

- Google Sheets integration to manage RuneScape (main and alt) accounts
- Track member activity in your Discord, and optionally via in-game clan chat
- Manage clan points:
  - Add or remove clan points
  - Allow users to claim clan points every day
  - Reward clan points based on TempleOSRS competition results
  - Robust tracking of transactions
- Customisable config per Discord server
- Easy setup with Docker or local environment

To-do:
- Allow members to submit event attendance reports
- Allow members to submit BotW drops, splits, bingo tile completions
- More advanced activity tracking by tracking the amount of messages a day and providing more granular options

---

## Pre-requisites

You can develop or run the bot using either Docker (recommended) or your local environment.

### Option A: Docker (recommended)

- [Docker](https://www.docker.com)
- [Buildx](https://github.com/docker/buildx)
- [Node.js 23](https://nodejs.org/en) or newer (to register commands)

### Option B: local

- [Node.js 23](https://nodejs.org/en) or newer
- [PostgreSQL](https://www.postgresql.org)

---

## Setup
### 1. Clone repository

```bash
git clone https://github.com/cyanthvibes/elysian-spirit.git
cd elysian-spirit
```

### 2. Create environment files

Create `.env.development` and/or `.env.production` based on `.env.example`

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications/) and create an application
2. Under the **Bot** section, create a bot to obtain your `BOT_ID` and `BOT_TOKEN`
3. Enable all privileged gateway intents

### 3. Development server setup

1. Create a test server on Discord
2. Enable **Developer Mode** in your Discord client (Settings > Advanced)
3. Shift + right-click to copy:
   - `OWNER_ID` from your profile
   - `TEST_GUILD_ID` from your test server

**Important: for `.env.development`: `TEST_GUILD_ID` is required. For `.env.production`, it can be omitted.**

### 4. Configuration files

Create `config.json` based on `example_config.json`.

You'll need to add configuration for every Discord server the bot will serve.

`OSRS_CLAN_CHAT_CHANNEL` and `END_ROW` are optional.

### 5. Google credentials

1. Set up a Google Spreadsheet or use existing one
2. Set up API access to the spreadsheet and get a `google_credentials.json` file
3. The spreadsheet must include the following columns:
    - RSN
    - Discord IDs
    - ALTs
    <br>
    (Exact columns can be configured in `config.json`)
4. Rename the file to `[guild_id]_google_credentials.json` and place it in `/google_credentials/`

### 6. Invite the bot to your test server

Use the OAuth2 URL Generator in the Developer Portal (`bot` scope), or use:

`https://discord.com/oauth2/authorize?client_id=${BOT_ID}&permissions=0&integration_type=0&scope=bot`

### 7. Enable commands for your server

Bot owners can always use every command, everywhere.

By default, commands are disabled for every guild the bot is in. 
You can enable or disable them by using this command in the chat:
`[prefix]commands enable|disable`

If commands are disabled, staff can still use commands where `isPrivileged = true`.

---

## Registering commands

Slash commands and context-menu commands must be registered to Discord before they appear.

This can be done globally (about once an hour, otherwise rate-limited), or for your test guild.

For production:
```bash
# Install dependencies
npm install

# register commands (guild or global)
npm run register-guild-prod
npm run register-global-prod

# clear commands (guild or global)
npm run clear-guild-prod
npm run clear-global-prod
```

---

## Development workflow

### Using docker (recommended)

```bash
make dev                          # Start dev containers
make dev-migrate name=feature     # Create and apply a new migration after schema changes
```

- Installs all dependencies
- Waits for the database to be ready
- Runs `npx prisma generate` to generate the Prisma client
- Runs `npx prisma db push` to quickly sync the schema to the development database (this does NOT create migration files)
- Use `make dev-migrate name=your_migration` to create and apply migration files after schema changes
- Starts the bot in development mode and using `tsx watch` for hot-reloading

### Running locally (without Docker)

Ensure PostgreSQL is installed and running.

```bash
npm install                                     # Install dependencies (only once or when package.json changes)
npx prisma migrate dev --name your_migration    # Create and apply a new migration after schema changes
npx prisma generate                             # Generate the Prisma client 
npm run dev                                     # Start the bot in development mode
```

Use `npx prisma db push` for quick schema syncs, 
but always use `npx prisma migrate dev` to create migration files for production changes. 
Migration files should be committed to version control.

---

## Production workflow

### Using docker (recommended)

```bash
make prod-pull        # Pull the latest prebuilt production image from GHCR
make prod-migrate     # Run database migrations (once after schema changes)
make prod-up          # Start production containers
make prod-down        # Stop production containers
```

Migrations are not run automatically. You must run `make prod-migrate` manually before starting the bot.

- The bot image is prebuilt and pulled from the registry
- The Prisma client is generated at container setup

### Running locally (without Docker)

This should only be used for local production; in real deployments, use the prebuilt Docker image and manual migration step as above.
Ensure PostgreSQL is installed and running.

```bash
npm install --omit=dev      # Install dependencies (only once or when package.json changes)
npx prisma migrate deploy   # Run database migrations (once after schema changes)
npx prisma generate         # Generate the Prisma client 
npm run build:full          # Build the production bundle
npm run prod                # Start the bot
```

---

## Database migrations: development vs. production

### Development

After making changes to the Prisma schema, create a new migration file:

```bash
make dev-migrate name=descriptive_migration_name
```

This generates a new migration file and applies it to the development database. This file should be committed to version control.
`npx prisma db push` updates the development database schema but does NOT create migration files.
Migration files are required for production deployments.

### Production

Never use `npx prisma db push` in production. To apply schema changes in production:

1. Make sure all migration files are committed and pushed
2. On the production server, run `make prod-migrate`

This applies all pending migrations to the production database.

---

## Contributing

1. Fork this repository and clone your fork
2. Create a new branch for your feature or bugfix
3. Make your changes
4. Run `npm run lint`, `npm run prettier`, and `npm run build`, to ensure code quality
5. Commit your changes and push your branch (check out: [gitmoji](https://gitmoji.dev))
6. Open a pull request describing your changes

Please follow the existing code style and conventions. If you have any questions or want to discuss a feature, 
open an issue or start a discussion.

Feel free to DM me on Discord: [@cyanthvibes](https://discordapp.com/users/187286355435454466/)





