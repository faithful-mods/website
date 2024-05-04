'use server';
import 'server-only';

import { Resolution, Texture, UserRole } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';
import type { ContributionActivationStatus, Progression } from '~/types';

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
	if (textureFile) await remove(textureFile as `/files/${string}`);

	// Contributions
	await db.contributionDeactivation.deleteMany({ where: { textureId: id } });

	// Delete in database
	return db.texture.delete({ where: { id } });
}

export async function getTextureStatus(textureId: string): Promise<ContributionActivationStatus[]> {
	return db.contributionDeactivation.findMany({
		where: {
			textureId,
		},
	}).then((response) => {
		const general = response.find((r) => r.resolution === null);
		const resolutions = response.filter((r) => r.resolution !== null);

		return [
			...(Object.keys(Resolution) as Resolution[]).map((res) => ({ resolution: res, status: !resolutions.some((r) => r.resolution === res) })),
			{ resolution: null, status: !general },
		];
	});
}

export interface UpdateTextureParams {
	id: string;
	name: string;
	aliases: string[];
	contributions: ContributionActivationStatus[];
}

export async function updateTexture({ id, name, aliases, contributions }: UpdateTextureParams): Promise<Texture> {
	await canAccess(UserRole.COUNCIL);

	const editedGeneral = contributions.find(cs => cs.resolution === null);
	const editedResolutions = contributions.filter(cs => cs.resolution !== null);

	// clean up
	await db.contributionDeactivation.deleteMany({ where: { textureId: id } });
	// general contributions are disabled: only add general
	if (editedGeneral && !editedGeneral.status) await db.contributionDeactivation.create({ data: { textureId: id } });
	// general contributions are enabled: check for resolutions deactivation
	if (editedGeneral && editedGeneral.status) {
		for (const eRes of editedResolutions) {
			if (!eRes.status) await db.contributionDeactivation.create({ data: { textureId: id, resolution: eRes.resolution } });
		}
	}

	// update name & aliases and return the updated texture
	return db.texture.update({ where: { id }, data: { name, aliases } });
};
