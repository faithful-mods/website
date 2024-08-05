'use server';
import 'server-only';

import { Status, UserRole, type ModVersion, type Modpack } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';
import { socket } from '~/lib/serversocket';
import { EMPTY_PROGRESSION_RES, sortBySemver } from '~/lib/utils';
import type { ModVersionExtended, Progression, SocketModUpload } from '~/types';

import { removeModFromModpackVersion } from './modpacks-version';
import { deleteResource } from './resource';
import { extractModVersionsFromJAR } from '../actions/files';

// GET

export async function getSupportedMinecraftVersions(): Promise<string[]> {
	return db.modVersion.findMany({ distinct: ['mcVersion'] })
		.then((res) => res.map((r) => r.mcVersion))
		.then((res) => res.sort(sortBySemver));
}

export async function getModVersionsWithModpacks(modId: string): Promise<ModVersionExtended[]> {
	const res: ModVersionExtended[] = [];
	const modVersions = await db.modVersion.findMany({ where: { modId } });

	for (const modVer of modVersions) {
		const modpacks = await db.modpackVersion
			.findMany({ where: { mods: { some: { id: modVer.id } } }, include: { modpack: true } })
			.then((mvs) => mvs.map((mv) => mv.modpack));

		const [linked, textures] = await getNumberOfTextureFromModVersion(modVer.id);

		res.push({ ...modVer, modpacks, textures, linked });
	}

	return res;
}

export async function getNumberOfTextureFromModVersion(modVersionId: string) {
	const resources = await db.resource.findMany({ where: { modVersionId }, include: { textures: true } });
	const totalLinked = resources.reduce((acc, res) => acc + res.textures.length, 0);

	const linked = resources.map((r) => r.textures).flat();
	const totalTextures = await db.texture.count({ where: { id: { in: linked.map((l) => l.textureId) } } });

	return [totalLinked, totalTextures];
}

export async function getModsVersionsFromResources(resourceIds: string[]): Promise<(ModVersion & { resources: string[] })[]> {
	return db.modVersion
		.findMany({
			where: { resources: { some: { id: { in: resourceIds } } } },
			include: { resources: { select: { id: true } } },
		})
		.then((res) => res.map((modVer) => ({ ...modVer, resources: modVer.resources.map((r) => r.id) })));
}

export async function getModVersionProgression(modVersionId: string): Promise<Progression | null> {
	const modVersion = await db.modVersion.findUnique({ where: { id: modVersionId }, include: { resources: true } });
	if (!modVersion) return null;

	// get all textures uses for the mod version
	const linkedTexturesIds = await db.linkedTexture.findMany({ where: { resourceId: { in: modVersion.resources.map((r) => r.id) } }, select: { textureId: true } });

	// filter duplicates
	const uniqueTextures = linkedTexturesIds.filter((lt, i, arr) => arr.findIndex((lt2) => lt2.textureId === lt.textureId) === i);

	// get all contributions for the textures
	const contributionsIds = await db.contribution.findMany({
		where: {
			textureId: { in: uniqueTextures.map((e) => e.textureId) },
			status: Status.ACCEPTED,
		},
		select: {
			textureId: true,
			resolution: true,
			id: true,
		},
	});

	// keep only one contribution per resolution per texture
	const contributions = contributionsIds.filter(
		(c, i, arr) => arr.findIndex((c2) => c2.textureId === c.textureId && c2.resolution === c.resolution) === i
	);

	// split contributions per resolution
	const progression: Progression = {
		textures: {
			done: Object.assign({}, EMPTY_PROGRESSION_RES),
			todo: uniqueTextures.length,
		},
		linkedTextures: linkedTexturesIds.length,
	};

	for (const contribution of contributions) {
		progression.textures.done[contribution.resolution] += 1;
	}

	return progression;
}

// POST

/**
 * This function will extract the mods from the JAR files and add them to the database.
 * @param jars files to extract the mods from
 * @param socketId the socket id to send the progression to
 * @returns A list of the added mod versions
 */
export async function addModVersionsFromJAR(jars: FormData, socketId: string): Promise<ModVersion[]> {
	await canAccess(UserRole.COUNCIL);

	let status: SocketModUpload = {
		mods: { total: 0, done: 0 },
		modInfos: { total: 0, done: 0 },
		textures: { total: 0, done: 0 },
	};

	const res: ModVersion[] = [];
	const files = jars.getAll('files') as File[];

	status.mods.total = files.length;
	socket?.emit(socketId, status);

	for (const file of files) {
		const extracted = await extractModVersionsFromJAR(file, socketId, status);
		res.push(...extracted[0]);

		status = extracted[1];
		status.mods.done += 1;
		socket?.emit(socketId, status);
	}

	// remove duplicates
	const unique = new Set(res.map((modVer) => modVer.id));
	return res.filter((modVer) => unique.has(modVer.id));
}

export async function createModVersion({
	mod,
	version,
	mcVersion,
}: {
	mod: { id: string };
	version: string;
	mcVersion: string;
}): Promise<ModVersion> {
	await canAccess(UserRole.COUNCIL);

	return db.modVersion.create({ data: { modId: mod.id, version, mcVersion } });
}

export async function updateModVersion({ id, version, mcVersion }: { id: string; version: string; mcVersion: string }) {
	await canAccess(UserRole.COUNCIL);
	return await db.modVersion.update({ where: { id }, data: { version, mcVersion } });
}

// DELETE

export async function removeModpackFromModVersion(modVersionId: string, modpackId: string): Promise<Modpack[]> {
	await canAccess(UserRole.COUNCIL);
	const modpackVersionId = await db.modpackVersion.findFirst({
		where: { modpackId, mods: { some: { id: modVersionId } } },
	});
	if (!modpackVersionId) throw new Error(`Modpack with id '${modpackId}' not found`);

	await removeModFromModpackVersion(modpackVersionId.id, modVersionId);
	return await db.modpackVersion
		.findMany({ where: { mods: { some: { id: modVersionId } } }, include: { modpack: true } })
		.then((mvs) => mvs.map((mv) => mv.modpack));
}

export async function deleteModVersion(id: string): Promise<ModVersion> {
	await canAccess(UserRole.COUNCIL);
	const resources = await db.resource.findMany({ where: { modVersionId: id } });

	for (const resource of resources) {
		await deleteResource(resource.id);
	}

	return db.modVersion.delete({ where: { id } });
}
