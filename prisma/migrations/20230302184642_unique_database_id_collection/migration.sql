/*
  Warnings:

  - A unique constraint covering the columns `[collection]` on the table `UserCollection` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[databaseId]` on the table `UserCollection` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "UserCollection_collection_databaseId_key";

-- CreateIndex
CREATE UNIQUE INDEX "UserCollection_collection_key" ON "UserCollection"("collection");

-- CreateIndex
CREATE UNIQUE INDEX "UserCollection_databaseId_key" ON "UserCollection"("databaseId");
