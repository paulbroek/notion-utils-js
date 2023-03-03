/*
  Warnings:

  - A unique constraint covering the columns `[collection,databaseId]` on the table `UserCollection` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserCollection_collection_databaseId_key" ON "UserCollection"("collection", "databaseId");
