/*
  Warnings:

  - A unique constraint covering the columns `[version,modpack_id]` on the table `modpacks_versions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[version,mod_id]` on the table `mods_versions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "modpacks_versions_version_modpack_id_key" ON "modpacks_versions"("version", "modpack_id");

-- CreateIndex
CREATE UNIQUE INDEX "mods_versions_version_mod_id_key" ON "mods_versions"("version", "mod_id");
