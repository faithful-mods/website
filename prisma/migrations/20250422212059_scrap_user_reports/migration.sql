/*
  Warnings:

  - You are about to drop the `report_reasons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reports` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_reportReasonId_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_user_reported_id_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_user_reporter_id_fkey";

-- AlterTable
ALTER TABLE "_contributions_to_coauthors" ADD CONSTRAINT "_contributions_to_coauthors_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_contributions_to_coauthors_AB_unique";

-- AlterTable
ALTER TABLE "_mods_versions_to_modpacks_versions" ADD CONSTRAINT "_mods_versions_to_modpacks_versions_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_mods_versions_to_modpacks_versions_AB_unique";

-- AlterTable
ALTER TABLE "_polls_downvotes_to_users" ADD CONSTRAINT "_polls_downvotes_to_users_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_polls_downvotes_to_users_AB_unique";

-- AlterTable
ALTER TABLE "_polls_upvotes_to_users" ADD CONSTRAINT "_polls_upvotes_to_users_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_polls_upvotes_to_users_AB_unique";

-- AlterTable
ALTER TABLE "_relations" ADD CONSTRAINT "_relations_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_relations_AB_unique";

-- DropTable
DROP TABLE "report_reasons";

-- DropTable
DROP TABLE "reports";
