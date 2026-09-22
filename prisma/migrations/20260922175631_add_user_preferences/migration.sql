-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'UTC';
