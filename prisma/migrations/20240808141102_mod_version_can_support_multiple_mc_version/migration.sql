/*
  Warnings:

  - The `minecraft_version` column on the `mods_versions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "mods_versions" DROP COLUMN "minecraft_version",
ADD COLUMN     "minecraft_version" TEXT[];
