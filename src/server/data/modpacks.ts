'use server';
import 'server-only';

import { UserRole } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';

import { remove, upload } from '../actions/files';

import type { Modpack } from '@prisma/client';

// GET

export async function getModpacks(): Promise<Modpack[]> {
	return db.modpack.findMany();
}

// POST

export async function updateModpack({
	id,
	name,
	description,
	authors,
}: {
	id: string;
	name: string;
	description?: string;
	authors: string[];
}): Promise<Modpack> {
	await canAccess(UserRole.COUNCIL);

	const modpack = await db.modpack.findUnique({ where: { id } });
	return db.modpack.update({ where: { id }, data: { ...modpack, name, description, authors } });
}

export async function createModpack({
	name,
	description,
	authors,
}: {
	name: string;
	description?: string;
	authors: string[];
}): Promise<Modpack> {
	await canAccess(UserRole.COUNCIL);
	return db.modpack.create({ data: { name, description, authors } });
}

export async function updateModpackPicture(id: string, data: FormData): Promise<Modpack> {
	await canAccess(UserRole.COUNCIL);

	const filepath = await upload(data.get('file') as File, 'modpacks/');
	return await db.modpack.update({ where: { id }, data: { image: filepath } });
}

// DELETE

export async function deleteModpack(id: string): Promise<Modpack> {
	await canAccess(UserRole.COUNCIL);

	const modpackImg = await db.modpack.findUnique({ where: { id } }).then((modpack) => modpack?.image);
	if (modpackImg) await remove(modpackImg as `/files/${string}`);

	const modpackVersions = await db.modpackVersion.findMany({ where: { modpackId: id } });
	for (const modpackVersion of modpackVersions) {
		await db.modpackVersion.delete({ where: { id: modpackVersion.id } });
	}

	return db.modpack.delete({ where: { id } });
}

export async function voidModpacks(): Promise<void> {
	await canAccess();

	const modpacks = await db.modpack.findMany();
	for (const modpack of modpacks) {
		await deleteModpack(modpack.id);
	}
}
