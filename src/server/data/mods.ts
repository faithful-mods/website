'use server';
import 'server-only';

import { UserRole, type Mod } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';
import { extractSemver } from '~/lib/utils';

import { deleteModVersion } from './mods-version';
import { remove, upload } from '../actions/files';

// GET

export async function getModsFromIds(ids: string[]): Promise<Mod[]> {
	return db.mod.findMany({ where: { id: { in: ids } } });
}

export async function getMods(): Promise<(Mod & { unknownVersion: boolean })[]> {
	return db.mod
		.findMany({ include: { versions: { select: { mcVersion: true } } }, orderBy: { name: 'asc' }})
		.then((mods) =>
			mods.map((mod) => {
				return { ...mod, unknownVersion: mod.versions.map((v) => extractSemver(v.mcVersion)).filter((v) => v === null).length > 0 };
			})
		);
}

export async function getModsWithVersions(): Promise<(Mod & { versions: string[] })[]> {
	return db.mod.findMany({ include: { versions: { select: { mcVersion: true } } }, orderBy: { name: 'asc' } }).then((mods) =>
		mods.map((mod) => {
			return { ...mod, versions: mod.versions.map((v) => v.mcVersion) };
		})
	);
}

export async function modHasUnknownVersion(id: string): Promise<boolean> {
	const mod = await db.mod.findUnique({ where: { id }, include: { versions: { select: { mcVersion: true } } } });
	return mod ? mod.versions.map((v) => extractSemver(v.mcVersion)).filter((v) => v === null).length > 0 : false;
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
