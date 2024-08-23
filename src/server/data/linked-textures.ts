'use server';
import 'server-only';

import { UserRole } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';

import type { LinkedTexture } from '@prisma/client';

// GET

export async function getLinkedTexturesFrom(textureId: number): Promise<LinkedTexture[]> {
	return db.linkedTexture.findMany({
		where: {
			textureId,
		},
	});
}

// DELETE

export async function deleteLinkedTexture(id: string): Promise<LinkedTexture> {
	await canAccess(UserRole.COUNCIL);

	return db.linkedTexture.delete({
		where: {
			id,
		},
	});
}
