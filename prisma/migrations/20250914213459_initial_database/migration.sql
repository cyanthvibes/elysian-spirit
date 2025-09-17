-- CreateEnum
CREATE TYPE "public"."ActionType" AS ENUM ('ADD', 'REMOVE', 'DAILY', 'TEMPLE', 'UNDO', 'AUDIT', 'HISTORY');

-- CreateTable
CREATE TABLE "public"."Guild" (
    "guildID" TEXT NOT NULL,
    "commandsEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("guildID")
);

-- CreateTable
CREATE TABLE "public"."Member" (
    "id" TEXT NOT NULL,
    "discordID" TEXT NOT NULL,
    "guildID" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "clanPointsLastClaimedAt" TIMESTAMP(3),
    "lastMessageSentAt" TIMESTAMP(3),

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClanPointTransaction" (
    "id" TEXT NOT NULL,
    "actionType" "public"."ActionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedByID" TEXT NOT NULL,
    "guildID" TEXT NOT NULL,
    "undone" BOOLEAN NOT NULL DEFAULT false,
    "undoneAt" TIMESTAMP(3),
    "undoneByID" TEXT,
    "undoOfID" TEXT,

    CONSTRAINT "ClanPointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClanPointAction" (
    "id" TEXT NOT NULL,
    "targetMemberID" TEXT NOT NULL,
    "guildID" TEXT NOT NULL,
    "actionType" "public"."ActionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "previousBalance" INTEGER,
    "transactionID" TEXT NOT NULL,
    "performedByID" TEXT NOT NULL,

    CONSTRAINT "ClanPointAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_discordID_guildID_key" ON "public"."Member"("discordID", "guildID");

-- CreateIndex
CREATE UNIQUE INDEX "ClanPointTransaction_undoOfID_key" ON "public"."ClanPointTransaction"("undoOfID");

-- AddForeignKey
ALTER TABLE "public"."Member" ADD CONSTRAINT "Member_guildID_fkey" FOREIGN KEY ("guildID") REFERENCES "public"."Guild"("guildID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClanPointTransaction" ADD CONSTRAINT "ClanPointTransaction_performedByID_fkey" FOREIGN KEY ("performedByID") REFERENCES "public"."Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClanPointTransaction" ADD CONSTRAINT "ClanPointTransaction_guildID_fkey" FOREIGN KEY ("guildID") REFERENCES "public"."Guild"("guildID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClanPointTransaction" ADD CONSTRAINT "ClanPointTransaction_undoneByID_fkey" FOREIGN KEY ("undoneByID") REFERENCES "public"."Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClanPointTransaction" ADD CONSTRAINT "ClanPointTransaction_undoOfID_fkey" FOREIGN KEY ("undoOfID") REFERENCES "public"."ClanPointTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClanPointAction" ADD CONSTRAINT "ClanPointAction_targetMemberID_fkey" FOREIGN KEY ("targetMemberID") REFERENCES "public"."Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClanPointAction" ADD CONSTRAINT "ClanPointAction_guildID_fkey" FOREIGN KEY ("guildID") REFERENCES "public"."Guild"("guildID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClanPointAction" ADD CONSTRAINT "ClanPointAction_transactionID_fkey" FOREIGN KEY ("transactionID") REFERENCES "public"."ClanPointTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClanPointAction" ADD CONSTRAINT "ClanPointAction_performedByID_fkey" FOREIGN KEY ("performedByID") REFERENCES "public"."Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
