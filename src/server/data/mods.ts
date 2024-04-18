'use server';
import 'server-only';

import type { Mod } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';

import { deleteModVersion } from './mods-version';
import { remove, upload } from '../actions/files';

export async function getModsFromIds(ids: string[]): Promise<Mod[]> {
	return db.mod.findMany({ where: { id: { in: ids } } });
}

export async function getMods(): Promise<Mod[]> {
	return db.mod.findMany();
}

export async function updateMod({
	id,
	name,
	description,
	authors,
	url,
	forgeId,
}: {
	id: string;
	name: string;
	description?: string;
	authors?: string[];
	url?: string;
	forgeId?: string;
}): Promise<Mod> {
	await canAccess();

	const mod = await db.mod.findUnique({ where: { id } });
	return db.mod.update({ where: { id }, data: { ...mod, ...{ name, description, authors, url, forgeId } } });
}

export async function updateModPicture(id: string, data: FormData): Promise<Mod> {
	await canAccess();

	const filepath = await upload(data.get('file') as unknown as File, 'mods/');
	return await db.mod.update({ where: { id }, data: { image: filepath } });
}

export async function createMod({
	name,
	description,
	authors,
	url,
	forgeId,
}: {
	name: string;
	description?: string;
	authors?: string[];
	url?: string;
	forgeId?: string;
}): Promise<Mod> {
	return db.mod.create({
		data: { name, description, authors: authors ?? [], url, forgeId },
	});
}

export async function deleteMod(id: string): Promise<Mod> {
	await canAccess();

	const modImg = await db.mod.findUnique({ where: { id } }).then((mod) => mod?.image);
	if (modImg) await remove(modImg as `files/${string}`);

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
