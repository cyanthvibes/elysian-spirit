<div align="center">
<h1>Elysian Spirit</h1>
<img src="assets/logos/logo.png" alt="Elysian Spirit logo" width="250">

<p>
<strong><i>
Discord bot for the Old School RuneScape (OSRS) Elysium clan.<br> 
Manage clan points, track member activity, reward clan points based on TempleOSRS competitions, and more.
</i></strong>

Need help? DM [@cyanthvibes](https://discordapp.com/users/187286355435454466/) on Discord: 
</p>
</div>

---

## Features

- Google Sheets integration to manage RuneScape (main and alt) accounts
- Track member activity in your Discord, and optionally via in-game clan chat
- Manage clan points:
  - Add or remove clan points
  - Allow members to claim clan points every day
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

You can use Elysian Spirit with either Docker (recommended) or by running it locally with Node.js and PostgreSQL.

### Option A: Docker (recommended)

- [Docker](https://www.docker.com)
- [Buildx](https://github.com/docker/buildx)
- [Node.js 23](https://nodejs.org/en)+ (to register commands)

### Option B: local

- [Node.js 23](https://nodejs.org/en)+
- [PostgreSQL](https://www.postgresql.org)

---

## Setup
### 1. Clone repository

```bash
git clone https://github.com/cyanthvibes/elysian-spirit.git
cd elysian-spirit
```

### 2. Create environment files

Create `.env.development` and/or `.env.production` based on the template `.env.example`.

To deploy this project independently, change the `IMAGE` variable to use your own images.
Make sure to also set your repository secrets accordingly.

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications/) and create an application
2. Under the **Bot** section, create a bot to obtain your `BOT_ID` and `BOT_TOKEN`
3. Enable all privileged gateway intents

### 3. Development Discord server setup

1. Create a test server on Discord
2. Enable **Developer Mode** in your Discord client (Settings > Advanced)
3. Shift + right-click to copy:
   - `OWNER_ID` from your profile
   - `TEST_GUILD_ID` from your test server

**Important: for `.env.development`: `TEST_GUILD_ID` is required. For `.env.production`, it can be omitted.**

### 4. Configuration files

Create `config.json` based on `example_config.json`.

You'll need to add configuration for every Discord server the bot will serve.

`OSRS_CLAN_CHAT_CHANNEL`, `DAYS`, and `END_ROW` are optional. The `OSRS_CLAN_CHAT_CHANNEL` is the ID of the Discord text channel
where in-game clan chat is sent to using webhooks and the [Clan Chat Webhook](https://github.com/pascalla/clan-chat-webhook) Runelite plugin.

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

## Workflow with Docker (recommended)

### Development

- Work on a separate git branch
- First run these commands:
    ```bash
    make dev                                # Start the development container (hot-reload, mounts source, uses development DB)
    make dev-migrate name=your_migration    # Create and apply a new migration if you changed the Prisma schema
    ```
- Register commands for your Discord server if new ones are created
- Migration files should be committed to version control.
- Commit and push, then create a PR

Once changes are pushed to or merged with the main branch, GitHub will automatically build the production image.

### Production image testing

To test the prebuilt image, run:

```bash
make prod-local
```

This pulls the image from GHCR, runs migrations, and starts the stack using `.env.development` and the development DB.

### Production deployment

```bash
make prod-pull            # Pull the latest prebuilt image
make prod-migrate         # Run migrations once, and then after every Prisma schema change
make prod-up              # Start the production containers
make prod-down            # Stop the production containers
```

Remember to register commands globally if new ones are created.

---

## Workflow without Docker

Ensure PostgreSQL is installed and running.

### Development

```bash
npm install                                       # Install dependencies
npx prisma migrate dev --name your_migration      # Run migrations once, and then after every Prisma schema change
npx prisma generate                               # Generate the Prisma client
npm run dev                                       # Start the bot 
```

- Register commands for your Discord server if new ones are created
- Migration files should be committed to version control
- Commit and push, then create a PR

### Testing for production

```bash
npm install --omit=dev          # Install dependencies
npx prisma migrate deploy       # Run migrations once, and then after every Prisma schema change
npx prisma generate             # Generate the Prisma client 
npm run build:full              # Build the production bundle
npm run prod                    # Start the production container
```

Register commands for your Discord server if new ones are created.

### Production deployment

This is not recommended at all. The steps are the same as the ones above, but with `.env.production` and a production database.

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





