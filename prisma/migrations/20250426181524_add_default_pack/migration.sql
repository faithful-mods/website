/*
  Warnings:

  - Added the required column `pack` to the `textures` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DefaultPack" AS ENUM ('DEFAULT_PROGART', 'DEFAULT_JAPPA');

-- AlterTable
ALTER TABLE "textures" ADD COLUMN     "pack" "DefaultPack" NOT NULL;
