'use server';

import { ModVersion } from '@prisma/client';

import { db } from '~/lib/db';
import type { ModVersionWithModpacks } from '~/types';

import { deleteResource } from './resource';

export async function getModVersionsWithModpacks(modId: string): Promise<ModVersionWithModpacks[]> {
	const res: ModVersionWithModpacks[] = [];
	const modVersions = await db.modVersion.findMany({ where: { modId } });
	
	for (const modVer of modVersions) {
		console.log(modVer.id);
		const modpacks = await db.modpackVersion.findMany({ where: { mods: { some: { id: modVer.id }}}, include: { modpack: true }})
			.then((modpackVersions) =>
				modpackVersions.map((modpackVersion) => modpackVersion.modpack)
			);

		console.log(modpacks);

		res.push({ ...modVer, modpacks });
	}
	
	return res;
}

export async function createModVersion({ mod, version, mcVersion }: { mod: { id: string }, version: string, mcVersion: string }): Promise<ModVersion> {
	return db.modVersion.create({ data: { modId: mod.id, version, mcVersion } });
}

export async function deleteModVersion(id: string): Promise<ModVersion> {
	const resources = await db.resource.findMany({ where: { modVersionId: id } });

	for (const resource of resources) {
		await deleteResource(resource.id);
	}

	return db.modVersion.delete({ where: { id } });
}
