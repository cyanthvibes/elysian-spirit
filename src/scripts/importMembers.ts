// This script can import members into the database for a guild,
// assuming a .csv-file exists with columns Discord ID and Balance

// Usage: importMembers.js <guildID> <path/to/csv>

import { createId } from "@paralleldrive/cuid2";
import { parse } from "csv-parse/sync";
import fs from "fs";

import { PrismaClient } from "../generated/prisma/client.js";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const [, , guildID, csvPath] = process.argv;
  if (!guildID || !csvPath) {
    console.error(
      "Usage: ts-node importMembers.ts <guildID> <path/to/file.csv>",
    );
    process.exit(1);
  }

  // Ensure guild exists
  await prisma.guild.upsert({
    create: { guildID },
    update: {},
    where: { guildID },
  });

  const csv: string = fs.readFileSync(csvPath, "utf-8");
  const records: unknown[] = parse(csv, {
    columns: true,
    delimiter: ";",
    skip_empty_lines: true,
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  for (const { balance, discordID } of records) {
    if (!discordID || balance === undefined) {
      console.warn(`Skipping row: ${JSON.stringify({ balance, discordID })}`);
      continue;
    }
    await prisma.member.upsert({
      create: {
        balance: Number(balance),
        discordID,
        guildID,
        id: createId(),
      },
      update: { balance: Number(balance) },
      where: { discordID_guildID: { discordID, guildID } },
    });
    console.log(`Imported: ${discordID} (balance: ${balance})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally((): Promise<void> => prisma.$disconnect());
