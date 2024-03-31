'use server';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';
import type { ModpackVersionWithMods } from '~/types';

import { createMod } from './mods';
import { createModVersion } from './mods-version';
import { extractDefaultResourcePack, fetchMCModInfoFromJar } from '../actions/files';

export async function getModpackVersions(modpackId: string) {
	return await db.modpackVersion.findMany({ where: { modpackId }, include: { mods: true } });
}

export async function createModpackVersion({ modpack, version }: { modpack: { id: string }, version: string }) {
	await canAccess();
	return await db.modpackVersion.create({ data: { version, modpackId: modpack.id }, include: { mods: true }});
}

export async function updateModpackVersion({ id, version }: { id: string, version: string }) {
	await canAccess();
	return await db.modpackVersion.update({ where: { id }, data: { version }, include: { mods: true }});
}

/**
 * This method delete the modpack version and unlink all mods version from it,
 * mods versions are not deleted in the process
 * @param id The modpack version id
 * @returns The deleted modpack version
 */
export async function deleteModpackVersion(id: string) {
	await canAccess();
	return await db.modpackVersion.delete({ where: { id } });
}

/**
 * This method unlinks a mod version from a modpack version, but does not delete the mod version itself
 * @param modpackVersionId The modpack version id
 * @param modVersionId The mod version id
 * @returns The updated modpack version
 */
export async function removeModFromModpackVersion(
	modpackVersionId: string,
	modVersionId: string
): Promise<ModpackVersionWithMods> {
	await canAccess();
	return await db.modpackVersion.update({
		where: { id: modpackVersionId },
		data: { mods: { disconnect: { id: modVersionId } } },
		include: { mods: true },
	});
}

/**
 * Add mods to a modpack version
 * 
 * Create mod if first time
 * Create mod version if first time
 * 
 * @param id Modpack version id
 * @param data FormData with JAR files
 * @returns Updated modpack version
 */
export async function addModsToModpackVersion(id: string, data: FormData): Promise<ModpackVersionWithMods> {
	await canAccess();

	const files = data.getAll('file') as unknown as File[];
	for (const file of files) {
		const modInfos = await fetchMCModInfoFromJar(file)
			.then((info) => Array.isArray(info) ? info : info.modList)
			.catch((err) => {
				console.error(`Error while fetching 'mcmod.info' file from ${file.name}\n${err}`);
				return [];
			});

		for (const modInfo of modInfos) {
			// Sanitize modInfo
			if (modInfo.mcversion === 'extension \'minecraft\' property \'mcVersion\'')
				modInfo.mcversion = 'unknown';

			// Fetch corresponding mod or create it
			let mod = await db.mod.findFirst({ where: { forgeId: modInfo.modid } });
			if (!mod)
				mod = await createMod({
					name: modInfo.name,
					forgeId: modInfo.modid,
					description: modInfo.description,
					authors: modInfo.authorList,
					url: modInfo.url,
				});

			// Fetch corresponding mod version or create it
			let modVersion = await db.modVersion.findFirst({
				where: { modId: mod.id, version: modInfo.version ?? 'unknown' },
			});
			if (!modVersion) {
				modVersion = await createModVersion({
					mod,
					version: modInfo.version ?? 'unknown',
					mcVersion: modInfo.mcversion ?? 'unknown',
				});

				await extractDefaultResourcePack(file, modVersion);
			}

			await db.modpackVersion.update({
				where: { id },
				data: { mods: { connect: { id: modVersion.id } } },
			});
		}
	}

	return db.modpackVersion.findFirstOrThrow({ where: { id }, include: { mods: true } });
}
