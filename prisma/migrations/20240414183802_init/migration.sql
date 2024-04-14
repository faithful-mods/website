-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'COUNCIL', 'USER', 'BANNED');

-- CreateEnum
CREATE TYPE "Resolution" AS ENUM ('x32', 'x64');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('DRAFT', 'PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "users_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modpacks" (
    "id" TEXT NOT NULL,
    "authors" TEXT[],
    "name" TEXT NOT NULL,
    "image" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modpacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modpacks_versions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "modpack_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modpacks_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mods" (
    "id" TEXT NOT NULL,
    "forge_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "authors" TEXT[],
    "url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mods_versions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "minecraft_version" TEXT NOT NULL,
    "mod_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mods_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "asset_folder" TEXT NOT NULL,
    "mod_version_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "textures" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "filepath" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "textures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linked_textures" (
    "id" TEXT NOT NULL,
    "asset_path" TEXT NOT NULL,
    "texture_id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linked_textures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributions" (
    "id" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,
    "resolution" "Resolution" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'DRAFT',
    "pollId" TEXT NOT NULL,
    "textureId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polls" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_mods_versions_to_modpacks_versions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_contributions_to_coauthors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_polls_upvotes_to_users" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_polls_downvotes_to_users" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_accounts_provider_provider_account_id_key" ON "users_accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "resources_asset_folder_mod_version_id_key" ON "resources"("asset_folder", "mod_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "textures_hash_key" ON "textures"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "contributions_pollId_key" ON "contributions"("pollId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_mods_versions_to_modpacks_versions_AB_unique" ON "_mods_versions_to_modpacks_versions"("A", "B");

-- CreateIndex
CREATE INDEX "_mods_versions_to_modpacks_versions_B_index" ON "_mods_versions_to_modpacks_versions"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_contributions_to_coauthors_AB_unique" ON "_contributions_to_coauthors"("A", "B");

-- CreateIndex
CREATE INDEX "_contributions_to_coauthors_B_index" ON "_contributions_to_coauthors"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_polls_upvotes_to_users_AB_unique" ON "_polls_upvotes_to_users"("A", "B");

-- CreateIndex
CREATE INDEX "_polls_upvotes_to_users_B_index" ON "_polls_upvotes_to_users"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_polls_downvotes_to_users_AB_unique" ON "_polls_downvotes_to_users"("A", "B");

-- CreateIndex
CREATE INDEX "_polls_downvotes_to_users_B_index" ON "_polls_downvotes_to_users"("B");

-- AddForeignKey
ALTER TABLE "users_accounts" ADD CONSTRAINT "users_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modpacks_versions" ADD CONSTRAINT "modpacks_versions_modpack_id_fkey" FOREIGN KEY ("modpack_id") REFERENCES "modpacks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mods_versions" ADD CONSTRAINT "mods_versions_mod_id_fkey" FOREIGN KEY ("mod_id") REFERENCES "mods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_mod_version_id_fkey" FOREIGN KEY ("mod_version_id") REFERENCES "mods_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linked_textures" ADD CONSTRAINT "linked_textures_texture_id_fkey" FOREIGN KEY ("texture_id") REFERENCES "textures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linked_textures" ADD CONSTRAINT "linked_textures_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_textureId_fkey" FOREIGN KEY ("textureId") REFERENCES "textures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_mods_versions_to_modpacks_versions" ADD CONSTRAINT "_mods_versions_to_modpacks_versions_A_fkey" FOREIGN KEY ("A") REFERENCES "mods_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_mods_versions_to_modpacks_versions" ADD CONSTRAINT "_mods_versions_to_modpacks_versions_B_fkey" FOREIGN KEY ("B") REFERENCES "modpacks_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_contributions_to_coauthors" ADD CONSTRAINT "_contributions_to_coauthors_A_fkey" FOREIGN KEY ("A") REFERENCES "contributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_contributions_to_coauthors" ADD CONSTRAINT "_contributions_to_coauthors_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_polls_upvotes_to_users" ADD CONSTRAINT "_polls_upvotes_to_users_A_fkey" FOREIGN KEY ("A") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_polls_upvotes_to_users" ADD CONSTRAINT "_polls_upvotes_to_users_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_polls_downvotes_to_users" ADD CONSTRAINT "_polls_downvotes_to_users_A_fkey" FOREIGN KEY ("A") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_polls_downvotes_to_users" ADD CONSTRAINT "_polls_downvotes_to_users_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
