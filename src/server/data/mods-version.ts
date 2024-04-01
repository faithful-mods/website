'use server';

import { ModVersion } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';
import type { ModVersionWithModpacks } from '~/types';

import { deleteResource } from './resource';
import { extractModVersionsFromJAR } from '../actions/files';

export async function getModVersionsWithModpacks(modId: string): Promise<ModVersionWithModpacks[]> {
	const res: ModVersionWithModpacks[] = [];
	const modVersions = await db.modVersion.findMany({ where: { modId } });
	
	for (const modVer of modVersions) {
		const modpacks = await db.modpackVersion.findMany({ where: { mods: { some: { id: modVer.id }}}, include: { modpack: true }})
			.then((modpackVersions) =>
				modpackVersions.map((modpackVersion) => modpackVersion.modpack)
			);

		res.push({ ...modVer, modpacks });
	}
	
	return res;
}

export async function addModVersionsFromJAR(jar: FormData): Promise<ModVersion[]> {
	await canAccess();
	const res: ModVersion[] = [];

	const files = jar.getAll('files') as File[];
	for (const file of files) {
		res.push(...await extractModVersionsFromJAR(file))
	}

	// remove duplicates
	const unique = new Set(res.map((modVer) => modVer.id));
	return res.filter((modVer) => unique.has(modVer.id));
}

export async function createModVersion({ mod, version, mcVersion }: { mod: { id: string }, version: string, mcVersion: string }): Promise<ModVersion> {
	await canAccess();
	
	return db.modVersion.create({ data: { modId: mod.id, version, mcVersion } });
}

export async function deleteModVersion(id: string): Promise<ModVersion> {
	const resources = await db.resource.findMany({ where: { modVersionId: id } });

	for (const resource of resources) {
		await deleteResource(resource.id);
	}

	return db.modVersion.delete({ where: { id } });
}
