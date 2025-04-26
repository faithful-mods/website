'use server';
import 'server-only';

import { Pack, UserRole } from '@prisma/client';
import { Resolution } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';
import { extractSemver } from '~/lib/utils';

import { deleteModVersion } from './mods-version';
import { remove, upload } from '../actions/files';

import type { Mod } from '@prisma/client';
import type { Downloads } from '~/types';

// GET

export async function getModFromForgeId(forgeId: string): Promise<Mod | null> {
	return db.mod.findFirst({ where: { forgeId } });
}

export async function getModsFromIds(ids: string[]): Promise<Mod[]> {
	return db.mod.findMany({ where: { id: { in: ids } } });
}

export async function getMods(): Promise<(Mod & { unknownVersion: boolean })[]> {
	return db.mod
		.findMany({ include: { versions: { select: { mcVersion: true } } }, orderBy: { name: 'asc' } })
		.then((mods) =>
			mods.map((mod) => {
				return {
					...mod,
					unknownVersion: mod.versions
						.map((mv) => mv.mcVersion.some((v) => extractSemver(v) === null) || mv.mcVersion.length === 0)
						.filter((v) => !!v).length > 0
					|| mod.versions.length === 0,
				};
			})
		);
}

export async function getModDownloads(id: string): Promise<Downloads | null> {
	const results = await db.mod.findFirst({
		where: { id },
		include: {
			versions: {
				select: {
					downloads: true,
				},
			},
		},
	});

	if (!results) return null;

	return results?.versions
		.map((v) => v.downloads)
		.reduce<Downloads>((acc, curr) => {
			const packs = Object.keys(curr) as Pack[];

			for (const pack of packs) {
				if (!acc[pack]) {
					acc[pack] = curr[pack];
					continue; // skip res as it's the first time we see this pack (acc[pack][res] === curr[pack][res])
				}

				const resolutions = Object.keys(!curr[pack]) as Resolution[];
				for (const res of resolutions) {
					if (!acc[pack][res]) acc[pack][res] = curr[pack]?.[res] ?? 0;
					else acc[pack][res] += curr[pack]?.[res] ?? 0;
				}
			}

			return acc;
		}, {});
}

export type ModOfModsPage = Mod & {
	versions: string[];
	textures: number;
	downloads: Downloads;
};

export async function getModsOfModsPage(): Promise<ModOfModsPage[]> {
	return db.mod.findMany({
		include: {
			versions: {
				include: {
					resources: {
						include: {
							linkedTextures: true,
						},
					},
				},
			},
		},
		orderBy: {
			name: 'asc',
		},
	})
		.then((mods) =>
			mods.map((mod) => {
				return {
					...mod,
					versions: mod.versions
						.map((v) => v.mcVersion)
						.flat(),
					textures: mod.versions
						.map((v) => v.resources.map((r) => r.linkedTextures.length).flat())
						.flat()
						.reduce((a, b) => a + b, 0),
					downloads: mod.versions
						.map((v) => v.downloads)
						.reduce<Downloads>((acc, curr) => {
							const packs = Object.keys(curr) as Pack[];

							for (const pack of packs) {
								if (!acc[pack]) {
									acc[pack] = curr[pack];
									continue; // skip res as it's the first time we see this pack (acc[pack][res] === curr[pack][res])
								}

								const resolutions = Object.keys(!curr[pack]) as Resolution[];
								for (const res of resolutions) {
									if (!acc[pack][res]) acc[pack][res] = curr[pack]?.[res] ?? 0;
									else acc[pack][res] += curr[pack]?.[res] ?? 0;
								}
							}

							return acc;
						}, Object.assign({})),
				};
			})
		);
}

export async function modHasUnknownVersion(id: string): Promise<boolean> {
	const mod = await db.mod.findUnique({ where: { id }, include: { versions: { select: { mcVersion: true } } } });
	return mod
		? mod.versions.map((mv) => mv.mcVersion.some((v) => extractSemver(v) === null) || mv.mcVersion.length === 0).filter((v) => !!v).length > 0
		: false;
}

// POST

export async function updateMod({
	id,
	name,
	description,
	authors,
	url,
	forgeId,
	loaders,
}: {
	id: string;
	name: string;
	description?: string;
	authors?: string[];
	url?: string;
	forgeId?: string;
	loaders: string[];
}): Promise<Mod> {
	await canAccess(UserRole.COUNCIL);

	const mod = await db.mod.findUnique({ where: { id } });
	return db.mod.update({ where: { id }, data: { ...mod, ...{ name, description, authors, url, forgeId, loaders } } });
}

export async function updateModPicture(id: string, data: FormData): Promise<Mod> {
	await canAccess(UserRole.COUNCIL);

	const filepath = await upload(data.get('file') as File, 'mods/');
	return await db.mod.update({ where: { id }, data: { image: filepath } });
}

export async function createMod({
	name,
	description,
	authors,
	url,
	forgeId,
	loaders,
}: {
	name: string;
	description?: string;
	authors?: string[];
	url?: string;
	forgeId?: string;
	loaders: string[];
}): Promise<Mod> {
	await canAccess(UserRole.COUNCIL);

	return db.mod.create({
		data: { name, description, authors: authors ?? [], url, forgeId, loaders },
	});
}

// DELETE

export async function deleteMod(id: string): Promise<Mod> {
	await canAccess(UserRole.COUNCIL);

	const modImg = await db.mod.findUnique({ where: { id } }).then((mod) => mod?.image);
	if (modImg) await remove(modImg as `/files/${string}`);

	const modVersions = await db.modVersion.findMany({ where: { modId: id } });
	for (const modVersion of modVersions) {
		await deleteModVersion(modVersion.id);
	}

	return db.mod.delete({ where: { id } });
}

export async function voidMods(): Promise<void> {
	await canAccess();

	const mods = await db.mod.findMany();
	for (const mod of mods) {
		await deleteMod(mod.id);
	}
}
