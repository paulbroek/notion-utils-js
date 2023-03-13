/*
  Warnings:

  - You are about to drop the column `databaseId` on the `UserSettings` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DataCollection" AS ENUM ('GOODREADS', 'YOUTUBE', 'PODCHASER', 'MEETUP');

-- AlterTable
ALTER TABLE "UserSettings" DROP COLUMN "databaseId";

-- CreateTable
CREATE TABLE "UserCollection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "collection" "DataCollection" NOT NULL,
    "databaseId" TEXT,
    "userSettingsId" TEXT NOT NULL,

    CONSTRAINT "UserCollection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserCollection" ADD CONSTRAINT "UserCollection_userSettingsId_fkey" FOREIGN KEY ("userSettingsId") REFERENCES "UserSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
