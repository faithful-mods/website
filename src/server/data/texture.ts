'use server';
import 'server-only';

import { Status, UserRole } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';

import { deleteFile } from '../actions/simple-git';

import type { ContributionDeactivation, DefaultPack, Texture } from '@prisma/client';
import type { TextureMCMeta } from 'react-minecraft';
import type { Prettify } from '~/types';

import '~/lib/polyfills';

// GET

export type GetTextures = Prettify<Texture & {
	disabledContributions: ContributionDeactivation[];
}>;

export async function getTextures(): Promise<GetTextures[]> {
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

export async function getTextureStatus(textureId: number): Promise<PrismaJson.ContributionDeactivationSettingsType> {
	return db.contributionDeactivation
		.findFirst({ where: { textureId }, select: { settings: true } })
		.then((res) => res?.settings ?? { all: false, packs: {} });
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

export async function createTexture(
	name: string,
	filepath: string,
	hash: string,
	pack: DefaultPack,
	mcmeta?: TextureMCMeta,
): Promise<Texture> {
	await canAccess(UserRole.COUNCIL);

	return db.texture.create({
		data: {
			name,
			filepath,
			pack,
			hash,
			mcmeta,
		},
	});
}

export async function updateMCMETA(id: number, mcmeta: TextureMCMeta | undefined): Promise<Texture> {
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
	contributionsSettings?: PrismaJson.ContributionDeactivationSettingsType;
	vanillaTextureId: string | null;
}

export async function updateTexture({ id, name, aliases, contributionsSettings, vanillaTextureId }: UpdateTextureParams): Promise<Texture> {
	await canAccess(UserRole.COUNCIL);

	if (contributionsSettings) {
		let contributionsDeactivation = await db.contributionDeactivation.findFirst({ where: { textureId: id } });

		if (!contributionsDeactivation && (contributionsSettings.all === true || Object.keys(contributionsSettings.packs).length > 0)) {
			contributionsDeactivation = await db.contributionDeactivation.create({
				data: {
					textureId: id,
					settings: contributionsSettings,
				},
			});
		}

		else if (contributionsDeactivation) {
			if (!contributionsSettings.all && Object.values(contributionsSettings.packs).flat().length === 0) {
				await db.contributionDeactivation.delete({ where: { id: contributionsDeactivation.id } });
			}
			else {
				contributionsDeactivation = await db.contributionDeactivation.update({
					where: { id: contributionsDeactivation.id },
					data: {
						settings: contributionsSettings,
					},
				});
			}
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
	const texture = await db.texture.findUnique({ where: { id } });
	if (texture) await deleteFile(`${texture.hash}.png`);

	// Contributions
	await db.contributionDeactivation.deleteMany({ where: { textureId: id } });
	await db.contribution.updateMany({
		where: { textureId: id },
		data: { textureId: null, status: Status.ARCHIVED },
	});

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
