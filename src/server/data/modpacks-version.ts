'use server';
import 'server-only';

import { UserRole } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';
import { socket } from '~/lib/serversocket';

import { extractModVersionsFromJAR } from '../actions/files';

import type { ModpackVersionWithMods, SocketModUpload } from '~/types';

// GET

export async function getModpackVersions(modpackId: string) {
	return await db.modpackVersion.findMany({ where: { modpackId }, include: { mods: true } });
}

// POST

export async function createModpackVersion({ modpack, version }: { modpack: { id: string }; version: string }) {
	await canAccess(UserRole.COUNCIL);
	return await db.modpackVersion.create({ data: { version, modpackId: modpack.id }, include: { mods: true } });
}

export async function updateModpackVersion({ id, version }: { id: string; version: string }) {
	await canAccess(UserRole.COUNCIL);
	return await db.modpackVersion.update({ where: { id }, data: { version }, include: { mods: true } });
}

/**
 * Add mods to a modpack version
 *
 * Create mod if first time
 * Create mod version if first time
 *
 * @param id Modpack version id
 * @param jars FormData with JAR files
 * @param socketId Socket ID to send progress
 * @returns Updated modpack version
 */
export async function addModsToModpackVersion(id: string, jars: FormData, socketId: string): Promise<ModpackVersionWithMods> {
	await canAccess(UserRole.COUNCIL);

	let status: SocketModUpload = {
		mods: { total: 0, done: 0 },
		modInfos: { total: 0, done: 0 },
		textures: { total: 0, done: 0 },
	};

	const files = jars.getAll('files') as File[];

	status.mods.total = files.length;
	socket?.emit(socketId, status);

	for (const file of files) {
		// Create all mod versions from the JAR file, can be multiple mods in one file
		const extracted = await extractModVersionsFromJAR(file, socketId, status);
		status = extracted[1];

		for (const modVersion of extracted[0]) {
			await db.modpackVersion.update({
				where: { id },
				data: { mods: { connect: { id: modVersion.id } } },
			});

			status.mods.done += 1;
			socket?.emit(socketId, status);
		}
	}

	return db.modpackVersion.findFirstOrThrow({ where: { id }, include: { mods: true } });
}

// DELETE

/**
 * This method delete the modpack version and unlink all mods version from it,
 * mods versions are not deleted in the process
 * @param id The modpack version id
 * @returns The deleted modpack version
 */
export async function deleteModpackVersion(id: string) {
	await canAccess(UserRole.COUNCIL);
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
	await canAccess(UserRole.COUNCIL);
	return await db.modpackVersion.update({
		where: { id: modpackVersionId },
		data: { mods: { disconnect: { id: modVersionId } } },
		include: { mods: true },
	});
}
