-- CreateEnum
CREATE TYPE "FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "FriendRequest" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverEmail" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "FriendRequestStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSentAt" TIMESTAMP(3) NOT NULL,
    "sendCount" INTEGER NOT NULL DEFAULT 1,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "friendId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_tokenHash_key" ON "FriendRequest"("tokenHash");

-- CreateIndex
CREATE INDEX "FriendRequest_receiverEmail_status_idx" ON "FriendRequest"("receiverEmail", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_senderId_receiverEmail_key" ON "FriendRequest"("senderId", "receiverEmail");

-- CreateIndex
CREATE INDEX "Friendship_friendId_idx" ON "Friendship"("friendId");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_userId_friendId_key" ON "Friendship"("userId", "friendId");

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: users who already share an expense or settlement become friends
-- (both directions), so friend-only checks don't break existing data.
WITH pairs AS (
    SELECT e."ownerId" AS a, ep."userId" AS b
    FROM "ExpenseParticipant" ep JOIN "Expense" e ON e."id" = ep."expenseId"
    UNION
    SELECT e."paidById", ep."userId"
    FROM "ExpenseParticipant" ep JOIN "Expense" e ON e."id" = ep."expenseId"
    UNION
    SELECT "ownerId", "paidById" FROM "Expense"
    UNION
    SELECT "fromUserId", "toUserId" FROM "Settlement"
),
both_ways AS (
    SELECT a, b FROM pairs WHERE a <> b
    UNION
    SELECT b, a FROM pairs WHERE a <> b
)
INSERT INTO "Friendship" ("userId", "friendId")
SELECT a, b FROM both_ways
ON CONFLICT ("userId", "friendId") DO NOTHING;
