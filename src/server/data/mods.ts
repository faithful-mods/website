'use server';

import type { Mod } from '@prisma/client';

import { db } from '~/lib/db';

export async function getMods(ids: string[]): Promise<Mod[]> {
	return db.mod.findMany({ where: { id: { in: ids } } });
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
