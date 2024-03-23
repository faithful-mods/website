'use server';

import type { Modpack } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';
import type { CreateObject, UpdateObject } from '~/types';

import { remove, upload } from '../actions/files';

export async function getModpacks(): Promise<Modpack[]> {
	return db.modpack.findMany();
}

export async function updateModpack(m: UpdateObject<Modpack>): Promise<Modpack> {
	await canAccess();

	const modpack = await db.modpack.findUnique({ where: { id: m.id } });
	return db.modpack.update({ where: { id: m.id }, data: { ...modpack, ...m } });
}

export async function createModpack(m: CreateObject<Modpack, 'image'>): Promise<Modpack> {
	await canAccess();
	return db.modpack.create({ data: m });
}

export async function updateModpackPicture(id: string, data: FormData): Promise<Modpack> {
	await canAccess();

	const filepath = await upload(data.get('file') as unknown as File, 'modpacks/');
	return await db.modpack.update({ where: { id }, data: { image: filepath } });
}

export async function deleteModpack(id: string): Promise<Modpack> {
	await canAccess();

	const modpackImg = await db.modpack.findUnique({ where: { id } }).then((modpack) => modpack?.image);
	if (modpackImg) await remove(modpackImg as `files/${string}`);

	return db.modpack.delete({ where: { id } });
}
