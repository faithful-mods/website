'use server';
import 'server-only';

import { Resolution, UserRole } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';

import { remove } from '../actions/files';

import type { ContributionDeactivation, Texture } from '@prisma/client';
import type { ContributionActivationStatus, Progression, TextureMCMETA } from '~/types';

import '~/lib/polyfills';

// GET

export async function getTextures(): Promise<(Texture & { disabledContributions: ContributionDeactivation[] })[]> {
	return db.texture.findMany({ include: { disabledContributions: true } });
}

export type GetTexturesWithUsePaths = Texture & {
	disabledContributions: ContributionDeactivation[];
	linkedTextures: { assetPath: string }[];
};

export async function getTexturesWithUsePaths(): Promise<GetTexturesWithUsePaths[]> {
	return db.texture.findMany({ include: { disabledContributions: true, linkedTextures: { select: { assetPath: true } } } });
}

export async function getTexture(id: number): Promise<Texture | null> {
	return db.texture.findUnique({ where: { id } });
}

export async function getRelatedTextures(id: number): Promise<Texture[]> {
	return db.texture.findFirst({ where: { id }, include: { relations: true, relationOf: true } })
		.then((res) => [...(res?.relations ?? []), ...(res?.relationOf ?? [])])
		.then((res) => {
			return res.unique((t1, t2) => t1.id === t2.id);
		});
}

export async function getTextureStatus(textureId: number): Promise<ContributionActivationStatus[]> {
	return db.contributionDeactivation
		.findMany({
			where: {
				textureId,
			},
		})
		.then((response) => {
			const general = response.find((r) => r.resolution === null);
			const resolutions = response.filter((r) => r.resolution !== null);

			return [
				...(Object.keys(Resolution) as Resolution[]).map((res) => ({
					resolution: res,
					status: !resolutions.some((r) => r.resolution === res),
				})),
				{ resolution: null, status: !general },
			];
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

export async function getTexturesFromModVersion(modVersionId: string): Promise<Texture[]> {
	return db.resource.findMany({
		where: {
			modVersionId,
		},
		include: {
			linkedTextures: {
				include: {
					texture: true,
				},
			},
		},
	}).then((resources) =>
		resources
			.flatMap((r) => r.linkedTextures)
			.map((linkedTexture) => linkedTexture.texture)
			.unique((t1, t2) => t1.id === t2.id)
	);
}

// POST

export async function createTexture({
	name,
	filepath,
	hash,
	mcmeta,
}: {
	name: string;
	filepath: string;
	hash: string;
	mcmeta?: TextureMCMETA;
}): Promise<Texture> {
	await canAccess(UserRole.COUNCIL);

	return db.texture.create({
		data: {
			name,
			filepath,
			hash,
			mcmeta,
		},
	});
}

export async function updateMCMETA(id: number, mcmeta: TextureMCMETA | undefined): Promise<Texture> {
	await canAccess(UserRole.COUNCIL);

	return db.texture.update({
		where: { id },
		data: { mcmeta },
	});
}

interface UpdateTextureParams {
	id: number;
	name: string;
	aliases: string[];
	contributions: ContributionActivationStatus[];
	vanillaTextureId: string | null;
}

export async function updateTexture({ id, name, aliases, contributions, vanillaTextureId }: UpdateTextureParams): Promise<Texture> {
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
	return db.texture.update({
		where: { id },
		data: {
			name,
			aliases: aliases.length > 0 ? aliases : undefined,
			vanillaTextureId,
		},
	});
};

export async function addRelationsToTexture(textureId: number, relatedTextures: number[]): Promise<Texture[]> {
	await canAccess(UserRole.COUNCIL);

	// get current relations
	const currentRelations = await db.texture.findFirst({ where: { id: textureId }, include: { relations: true } }).then((res) => res?.relations ?? []);

	// add new relations
	const newRelations = relatedTextures.filter((rt) => !currentRelations.map((cr) => cr.id).includes(rt));
	return await db.texture
		.update({
			where: { id: textureId },
			data: {
				relations: { connect: newRelations.map((id) => ({ id })) },
			},
			include: { relations: true, relationOf: true },
		})
		.then((res) => [...res.relations, ...res.relationOf].unique((a, b) => a.id === b.id));
}

// DELETE

export async function deleteTexture(id: number): Promise<Texture> {
	await canAccess(UserRole.COUNCIL);

	// Delete on disk
	const textureFile = await db.texture.findUnique({ where: { id } }).then((texture) => texture?.filepath);
	if (textureFile) await remove(textureFile as `/files/${string}`);

	// Contributions
	await db.contributionDeactivation.deleteMany({ where: { textureId: id } });

	// Delete in database
	return db.texture.delete({ where: { id } });
}

export async function removeRelationFromTexture(textureId: number, relatedTextureId: number) {
	await canAccess(UserRole.COUNCIL);

	return db.texture
		.update({
			where: { id: textureId },
			data: {
				relations: { disconnect: { id: relatedTextureId } },
				relationOf: { disconnect: { id: relatedTextureId } },
			},
			include: { relations: true, relationOf: true },
		})
		.then((res) => [...res.relations, ...res.relationOf].unique((a, b) => a.id === b.id));
}
