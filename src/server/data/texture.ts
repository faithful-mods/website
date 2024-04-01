import { Texture } from '@prisma/client';

import { db } from '~/lib/db';

import { remove } from '../actions/files';

export async function createTexture({ name, filepath, hash }: { name: string, filepath: string, hash: string }): Promise<Texture> {
	return db.texture.create({
		data: {
			name,
			filepath,
			hash,
		}
	})
}

export async function findTexture({
	hash,
}: {
	hash: string;
}): Promise<Texture | null> {
	return db.texture.findFirst({
		where: {
			hash,
		},
	});
}

export async function deleteTexture(id: string): Promise<Texture> {
	// Delete on disk
	const textureFile = await db.texture.findUnique({ where: { id } }).then((texture) => texture?.filepath);
	if (textureFile) await remove(textureFile as `files/${string}`);

	// Delete in database
	return db.texture.delete({ where: { id } });
}