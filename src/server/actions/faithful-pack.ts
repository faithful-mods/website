'use server';
import 'server-only';

import { db } from '~/lib/db';
import { getVanillaResolution } from '~/lib/utils';

import type { FaithfulCached, Resolution } from '@prisma/client';
import type { FPContributions, FPContributionsRaw, FPStoredContribution, FPStoredContributions, FPTexture, FPTexturesRaw, FPUsersRaw } from '~/types';

export async function updateCachedFPTexture(textureId: string): Promise<FaithfulCached> {
	const texture: FPTexture = await fetch(`https://api.faithfulpack.net/v2/textures/${textureId}`, { method: 'GET' })
		.then((res) => res.json());

	const contributions: FPContributions = await fetch(`https://api.faithfulpack.net/v2/contributions/search?search=${textureId}`, { method: 'GET' })
		.then((res) => res.json());

	const users: FPUsersRaw = await fetch('https://api.faithfulpack.net/v2/users/names', { method: 'GET' })
		.then((res) => res.json());

	const cachedTexture = await db.faithfulCached.findFirst({
		where: { textureId },
	});

	const data = {
		textureId,
		textureName: texture.name,
		tags: texture.tags,

		contributions: contributions.map((c) => ({
			...c,
			owner: (() => {
				const user = users.find((u) => u.id === c.authors[0])!;
				return ({
					id: user?.id ?? 'unknown',
					username: user?.username ?? 'Unknown',
					image: user.uuid ? `https://visage.surgeplay.com/face/512/${user.uuid}` : null,
				});
			})(),

			coAuthors: c.authors
				.map((id) => users.find((u) => u.id === id))
				.filter((u) => !!u)
				.map((u) => ({
					...u,
					image: u.uuid ? `https://visage.surgeplay.com/face/512/${u.uuid}` : null,
				})),
		})),
	};

	// Can be false on first time cache
	if (cachedTexture) {
		await db.faithfulCached.updateMany({ where: { textureId }, data });
	}
	else {
		await db.faithfulCached.create({ data });
	}

	return db.faithfulCached.findFirstOrThrow({ where: { textureId } });
}

export async function updateCachedFP(): Promise<void> {
	console.log('Updating Faithful Pack cache...');

	// global cache save date (fake texture)
	const textureNull = await db.faithfulCached.findFirst({ where: { textureId: 'null' } });
	// first time cache
	if (!textureNull) {
		await db.faithfulCached.create({
			data: {
				textureId: 'null',
				textureName: 'null',
				tags: [],
				contributions: [],
			},
		});
	}
	// fake update to timestamp
	else await db.faithfulCached.updateMany({ where: { textureId: 'null' }, data: { textureName: 'null' } });

	const textures: FPTexturesRaw = await fetch('https://api.faithfulpack.net/v2/textures/raw', { method: 'GET' })
		.then((res) => res.json());

	const contributions: FPContributionsRaw = await fetch('https://api.faithfulpack.net/v2/contributions/raw', { method: 'GET' })
		.then((res) => res.json());

	const users: FPUsersRaw = await fetch('https://api.faithfulpack.net/v2/users/names', { method: 'GET' })
		.then((res) => res.json());

	const cachedTextures = await db.faithfulCached.findMany({
		where: {
			textureId: {
				in: Object.keys(textures),
			},
		},
	});

	for (const [id, texture] of Object.entries(textures)) {
		const textureContributions: FPStoredContributions = Object.values(contributions)
			.filter((c) => c.texture === texture.id)
			.map((c) => ({
				...c,

				owner: (() => {
					const user = users.find((u) => u.id === c.authors[0]);
					return ({
						id: user?.id ?? 'unknown',
						username: user?.username ?? 'Unknown',
						image: user?.uuid ? `https://visage.surgeplay.com/face/512/${user.uuid}` : null,
					});
				})(),

				coAuthors: c.authors
					.slice(1)
					.map((id) => users.find((u) => u.id === id))
					.filter((u) => !!u)
					.map((u) => ({
						...u,
						image: u.uuid ? `https://visage.surgeplay.com/face/512/${u.uuid}` : null,
					})),
			}));

		// Already known texture, update instead of creating
		if (cachedTextures.some((t) => t.textureId === id)) {
			await db.faithfulCached.updateMany({
				where: {
					textureId: id,
				},
				data: {
					textureName: texture.name,
					tags: texture.tags,
					contributions: textureContributions,
				},
			});
		}
		else {
			await db.faithfulCached.create({
				data: {
					textureId: id,
					textureName: texture.name,
					tags: texture.tags,
					contributions: textureContributions,
				},
			});
		}
	}

	console.log('Faithful Pack cache updated!');
}

export async function getVanillaTextures(): Promise<FaithfulCached[]> {
	const textureNull = await db.faithfulCached.findFirst({ where: { textureId: 'null' } });

	// older than 24h, update the whole cache
	if (!textureNull || textureNull?.updatedAt && Date.now() - textureNull.updatedAt.getTime() > 1000 * 60 * 60 * 24) {
		// Not awaited as it's a background task
		updateCachedFP();
	}

	return db.faithfulCached.findMany({ orderBy: { textureName: 'asc' } });
}

export async function isVanillaTextureContributed(textureId: string, resolution: Resolution): Promise<boolean> {
	return getVanillaTextureContributions(textureId, resolution)
		.then((res) => res.length > 0);
}

export async function getVanillaTextureContributions(textureId: string, resolution: Resolution): Promise<FPStoredContributions> {
	const texture = await db.faithfulCached.findFirst({ where: { textureId }, select: { contributions: true, updatedAt: true } });

	// check if cache is older than 1h, if so, update
	if (!texture || texture.updatedAt && Date.now() - texture.updatedAt.getTime() > 1000 * 60 * 60) {
		return updateCachedFPTexture(textureId)
			.then((t) => t.contributions.filter((c) => c.pack === getVanillaResolution(resolution)));
	}

	return texture.contributions
		.filter((c) => c.pack === getVanillaResolution(resolution));
}

export async function getLatestVanillaTextureContribution(textureId: string, resolution: Resolution): Promise<FPStoredContribution | null> {
	const contributions = await getVanillaTextureContributions(textureId, resolution);
	if (contributions.length === 0) return null;

	return contributions
		.filter((c) => c.pack === getVanillaResolution(resolution))
		.sort((a, b) => b.date - a.date)
		.shift() ?? null;
}
