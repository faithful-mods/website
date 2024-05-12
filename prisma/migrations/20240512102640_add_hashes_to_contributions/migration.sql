/*
  Warnings:

  - A unique constraint covering the columns `[hash]` on the table `contributions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hash` to the `contributions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "contributions" ADD COLUMN     "hash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "contributions_hash_key" ON "contributions"("hash");
