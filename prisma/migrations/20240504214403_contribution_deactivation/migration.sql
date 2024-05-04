-- CreateTable
CREATE TABLE "contributions_deactivation" (
    "id" TEXT NOT NULL,
    "texture_id" TEXT NOT NULL,
    "resolution" "Resolution",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contributions_deactivation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "contributions_deactivation" ADD CONSTRAINT "contributions_deactivation_texture_id_fkey" FOREIGN KEY ("texture_id") REFERENCES "textures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
