import { Texture } from '@prisma/client';

import { db } from '~/lib/db';

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