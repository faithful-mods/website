'use server';
import 'server-only';

import { Resolution, Texture } from '@prisma/client';

import { db } from '~/lib/db';
import type { Progression } from '~/types';

import { remove } from '../actions/files';

export async function getTextures(): Promise<Texture[]> {
	return db.texture.findMany();
}

export async function createTexture({
	name,
	filepath,
	hash,
}: {
	name: string;
	filepath: string;
	hash: string;
}): Promise<Texture> {
	return db.texture.create({
		data: {
			name,
			filepath,
			hash,
		},
	});
}

export async function getGlobalProgression() {
	const emptyRes = Object.keys(Resolution).reduce(
		(acc, res) => ({ ...acc, [res]: 0 }),
		{}
	) as Progression['textures']['done'];

	const todo = await db.texture.count();
	const linkedTextures = await db.linkedTexture.count();

	const contributedTextures = await db.texture
		.findMany({ where: { contributions: { some: {} } }, include: { contributions: true } })
		// keep contributions only
		.then((textures) => textures.map((texture) => texture.contributions).flat())
		// remove multiple contributions on the same resolution for the same texture
		.then((contributions) =>
			contributions.filter(
				(c, i, arr) => arr.findIndex((c2) => c2.textureId === c.textureId && c2.resolution === c.resolution) === i
			)
		)
		// count contributions per resolution
		.then((contributions) => {
			const output = emptyRes;

			for (const contribution of contributions) {
				output[contribution.resolution] += 1;
			}

			return output;
		});

	return {
		linkedTextures,
		textures: { done: contributedTextures, todo },
	};
}

export async function findTexture({ hash }: { hash: string }): Promise<Texture | null> {
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
