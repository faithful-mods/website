import { ModVersion } from '@prisma/client';

import { db } from '~/lib/db';

import { deleteResource } from './resource';

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
