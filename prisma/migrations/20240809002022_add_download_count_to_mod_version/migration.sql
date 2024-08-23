-- AlterTable
ALTER TABLE "mods_versions" ADD COLUMN     "downloads" JSONB NOT NULL DEFAULT '{}';
