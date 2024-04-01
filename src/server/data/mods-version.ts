'use server';

import { Resolution, type ModVersion, type Modpack, $Enums } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';
import { EMPTY_PROGRESSION, EMPTY_PROGRESSION_RES } from '~/lib/utils';
import type { ModVersionWithModpacks, ModVersionWithProgression, Progression } from '~/types';

import { removeModFromModpackVersion } from './modpacks-version';
import { deleteResource } from './resource';
import { extractModVersionsFromJAR } from '../actions/files';

export async function getModVersionsWithModpacks(modId: string): Promise<ModVersionWithModpacks[]> {
	const res: ModVersionWithModpacks[] = [];
	const modVersions = await db.modVersion.findMany({ where: { modId } });
	
	for (const modVer of modVersions) {
		const modpacks = await db.modpackVersion.findMany({ where: { mods: { some: { id: modVer.id }}}, include: { modpack: true }})
			.then((mvs) => mvs.map((mv) => mv.modpack));

		res.push({ ...modVer, modpacks });
	}
	
	return res;
}

function randInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

export async function getModsVersionsProgression(): Promise<ModVersionWithProgression[]> {
	const modVersions = (await db.modVersion.findMany({ include: { mod: true, resources: true } }))
		.map((modVer) => ({ 
			...modVer, 
			...EMPTY_PROGRESSION, 
			resources: modVer.resources.map((resource) => ({ 
				...resource, 
				...EMPTY_PROGRESSION,
			}))
		}))

	for (const modVersion of modVersions) {
		for (const resource of modVersion.resources) {
			const linkedTextures = await db.linkedTexture.findMany({ where: { resourceId: resource.id }});

			const textures = await db.texture.findMany({
				where: { 
					id: { in: linkedTextures.map((lt) => lt.textureId) } 
				},
			});

			const contributions = await db.texture.findMany({
				where: {
					contributions: { some: {} }, // at least one contribution
					id: { in: linkedTextures.map((lt) => lt.textureId) },
				},
				include: { contributions: true },
			})
				// keep contributions only
				.then((textures) => textures.map((texture) => texture.contributions).flat())
				// remove multiple contributions on the same resolution for the same texture
				.then((contributions) => contributions.filter((c, i, arr) => arr.findIndex((c2) => c2.textureId === c.textureId && c2.resolution === c.resolution) === i))
				// count contributions per resolution
				.then((contributions) => {
					const output = EMPTY_PROGRESSION_RES;

					for (const contribution of contributions) {
						output[contribution.resolution] += 1;
					}

					return output;
				})

			modVersion.linkedTextures += linkedTextures.length;
			modVersion.textures.todo += textures.length;
			(Object.keys(modVersion.textures.done) as Resolution[]).forEach((res) => modVersion.textures.done[res] += contributions[res]);

			resource.linkedTextures = linkedTextures.length;
			resource.textures.todo = textures.length;
			resource.textures.done = contributions;
		}
	}

	return modVersions.filter((modVer) => modVer.linkedTextures > 0); // only return mod versions with linked textures
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

export async function updateModVersion({ id, version, mcVersion }: { id: string, version: string, mcVersion: string }) {
	await canAccess();
	return await db.modVersion.update({ where: { id }, data: { version, mcVersion }});
}

export async function removeModpackFromModVersion(modVersionId: string, modpackId: string): Promise<Modpack[]> {
	const modpackVersionId = await db.modpackVersion.findFirst({ where: { modpackId, mods: { some: { id: modVersionId } }}})
	if (!modpackVersionId) throw new Error(`Modpack with id '${modpackId}' not found`);

	await removeModFromModpackVersion(modpackVersionId.id, modVersionId);
	return await db.modpackVersion.findMany({ where: { mods: { some: { id: modVersionId } } }, include: { modpack: true }})
		.then((mvs) => mvs.map((mv) => mv.modpack));
}

export async function deleteModVersion(id: string): Promise<ModVersion> {
	const resources = await db.resource.findMany({ where: { modVersionId: id } });

	for (const resource of resources) {
		await deleteResource(resource.id);
	}

	return db.modVersion.delete({ where: { id } });
}
