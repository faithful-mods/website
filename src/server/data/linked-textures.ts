'use server';
import 'server-only';

import { LinkedTexture } from '@prisma/client';

import { db } from '~/lib/db';

// GET

export async function getLinkedTexturesFrom(textureId:string): Promise<LinkedTexture[]> {
	return db.linkedTexture.findMany({
		where: {
			textureId,
		},
	});
}
