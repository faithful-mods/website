'use server';
import 'server-only';

import { LinkedTexture, UserRole } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';

// GET

export async function getLinkedTexturesFrom(textureId:string): Promise<LinkedTexture[]> {
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
