import type { Resource } from '@prisma/client';

import { db } from '~/lib/db';

export async function createResource({
	asset,
	modVersion,
}: {
	asset: string;
	modVersion: { id: string };
}): Promise<Resource> {
	return db.resource.create({
		data: {
			assetFolder: asset,
			modVersionId: modVersion.id,
		},
	});
}

export async function getResource({
	asset,
	modVersion,
}: {
	asset: string;
	modVersion: { id: string };
}): Promise<Resource | null> {
	return db.resource.findFirst({
		where: {
			assetFolder: asset,
			modVersionId: modVersion.id,
		},
	});
}

export async function linkTextureToResource({
	resource,
	texture,
	assetPath,
}: {
	resource: { id: string };
	texture: { id: string };
	assetPath: string;
}) {
	return await db.linkedTexture.create({
		data: {
			assetPath,
			resourceId: resource.id,
			textureId: texture.id,
		},
	});
}
