-- CreateTable
CREATE TABLE "faithful_cached" (
    "id" TEXT NOT NULL,
    "texture_id" INTEGER NOT NULL,
    "texture_name" TEXT NOT NULL,
    "tags" TEXT[],
    "contributions" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faithful_cached_pkey" PRIMARY KEY ("id")
);
