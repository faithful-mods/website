/*
  Warnings:

  - You are about to drop the column `file` on the `contributions` table. All the data in the column will be lost.
  - The `textureId` column on the `contributions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `textures` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `textures` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `A` on the `_relations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `B` on the `_relations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `filepath` to the `contributions` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `texture_id` on the `contributions_deactivation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `texture_id` on the `linked_textures` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "_relations" DROP CONSTRAINT "_relations_A_fkey";

-- DropForeignKey
ALTER TABLE "_relations" DROP CONSTRAINT "_relations_B_fkey";

-- DropForeignKey
ALTER TABLE "contributions" DROP CONSTRAINT "contributions_textureId_fkey";

-- DropForeignKey
ALTER TABLE "contributions_deactivation" DROP CONSTRAINT "contributions_deactivation_texture_id_fkey";

-- DropForeignKey
ALTER TABLE "linked_textures" DROP CONSTRAINT "linked_textures_texture_id_fkey";

-- AlterTable
ALTER TABLE "_relations" DROP COLUMN "A",
ADD COLUMN     "A" INTEGER NOT NULL,
DROP COLUMN "B",
ADD COLUMN     "B" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "resources"
RENAME COLUMN "textures" TO "linkedTextures";

-- AlterTable
ALTER TABLE "contributions"
RENAME COLUMN "file" TO "filepath";

-- AlterTable
ALTER TABLE "contributions" DROP COLUMN "textureId",
ADD COLUMN     "textureId" INTEGER;

-- AlterTable
ALTER TABLE "contributions_deactivation" DROP COLUMN "texture_id",
ADD COLUMN     "texture_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "linked_textures" DROP COLUMN "texture_id",
ADD COLUMN     "texture_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "textures" DROP CONSTRAINT "textures_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "textures_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "_relations_AB_unique" ON "_relations"("A", "B");

-- CreateIndex
CREATE INDEX "_relations_B_index" ON "_relations"("B");

-- AddForeignKey
ALTER TABLE "contributions_deactivation" ADD CONSTRAINT "contributions_deactivation_texture_id_fkey" FOREIGN KEY ("texture_id") REFERENCES "textures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linked_textures" ADD CONSTRAINT "linked_textures_texture_id_fkey" FOREIGN KEY ("texture_id") REFERENCES "textures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_textureId_fkey" FOREIGN KEY ("textureId") REFERENCES "textures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_relations" ADD CONSTRAINT "_relations_A_fkey" FOREIGN KEY ("A") REFERENCES "textures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_relations" ADD CONSTRAINT "_relations_B_fkey" FOREIGN KEY ("B") REFERENCES "textures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
