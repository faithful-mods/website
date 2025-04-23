/*
  Warnings:

  - You are about to drop the column `resolution` on the `contributions_deactivation` table. All the data in the column will be lost.
  - Added the required column `pack` to the `contributions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `settings` to the `contributions_deactivation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Pack" AS ENUM ('FAITHFUL', 'CLASSIC_FAITHFUL', 'CLASSIC_FAITHFUL_JAPPA');

-- AlterTable
ALTER TABLE "contributions" ADD COLUMN     "pack" "Pack" NOT NULL;

-- AlterTable
ALTER TABLE "contributions_deactivation" DROP COLUMN "resolution",
ADD COLUMN     "settings" JSONB NOT NULL;
