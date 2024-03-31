import { ModVersion } from '@prisma/client';

import { db } from '~/lib/db';

export async function createModVersion({ mod, version, mcVersion }: { mod: { id: string }, version: string, mcVersion: string }): Promise<ModVersion> {
	return db.modVersion.create({ data: { modId: mod.id, version, mcVersion } });
}