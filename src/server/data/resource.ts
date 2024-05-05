'use server';
import 'server-only';

import { UserRole, type Resource } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';

import { deleteTexture } from './texture';

// GET

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

export async function getResourceByIds(ids: string[]): Promise<Resource[]> {
	return db.resource.findMany({ where: { id: { in: ids } } });
}

// POST

export async function linkTextureToResource({
	resource,
	texture,
	assetPath,
}: {
	resource: { id: string };
	texture: { id: string };
	assetPath: string;
}) {
	await canAccess(UserRole.COUNCIL);

	return await db.linkedTexture.create({
		data: {
			assetPath,
			resourceId: resource.id,
			textureId: texture.id,
		},
	});
}

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

// DELETE

export async function deleteResource(id: string): Promise<Resource> {
	await canAccess(UserRole.COUNCIL);

	const linkedTextures = await db.linkedTexture.findMany({ where: { resourceId: id } });
	for (const linkedTexture of linkedTextures) {
		await db.linkedTexture.delete({ where: { id: linkedTexture.id } });

		const texture = await db.texture.findUnique({
			where: { id: linkedTexture.textureId },
			include: { linkedTextures: true },
		});
		if (texture && texture.linkedTextures.length === 0) await deleteTexture(texture.id);
	}

	return db.resource.delete({ where: { id } });
}
