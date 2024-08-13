/*
  Warnings:

  - You are about to drop the column `vanilla_texture` on the `textures` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[texture_id]` on the table `faithful_cached` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "textures" DROP COLUMN "vanilla_texture",
ADD COLUMN     "vanillaTexture" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "faithful_cached_texture_id_key" ON "faithful_cached"("texture_id");

-- AddForeignKey
ALTER TABLE "textures" ADD CONSTRAINT "textures_vanillaTexture_fkey" FOREIGN KEY ("vanillaTexture") REFERENCES "faithful_cached"("texture_id") ON DELETE SET NULL ON UPDATE CASCADE;
