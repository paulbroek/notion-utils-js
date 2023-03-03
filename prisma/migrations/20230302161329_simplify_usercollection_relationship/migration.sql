/*
  Warnings:

  - You are about to drop the column `userSettingsId` on the `UserCollection` table. All the data in the column will be lost.
  - You are about to drop the `UserSettings` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `UserCollection` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `UserCollection` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserCollection" DROP CONSTRAINT "UserCollection_userSettingsId_fkey";

-- DropForeignKey
ALTER TABLE "UserSettings" DROP CONSTRAINT "UserSettings_userId_fkey";

-- AlterTable
ALTER TABLE "UserCollection" DROP COLUMN "userSettingsId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "UserSettings";

-- CreateIndex
CREATE UNIQUE INDEX "UserCollection_userId_key" ON "UserCollection"("userId");

-- AddForeignKey
ALTER TABLE "UserCollection" ADD CONSTRAINT "UserCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
