'use server';
import 'server-only';

import { Status, UserRole } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';

import { getCounselors } from './user';

import type { Contribution, Pack, Poll, Resolution } from '@prisma/client';
import type { Prettify, PublicUser } from '~/types';

// GET

export type GetPendingContributions = Prettify<Omit<Contribution, 'status'> & {
	status: typeof Status.PENDING,
	coAuthors: PublicUser[],
	owner: PublicUser,
	poll: Poll & {
		upvotes: PublicUser[],
		downvotes: PublicUser[],
	}
}>

export async function getPendingContributions(): Promise<GetPendingContributions[]> {
	await canAccess(UserRole.COUNCIL);

	return await db.contribution.findMany({
		where: { status: Status.PENDING },
		include: {
			coAuthors: { select: { id: true, name: true, image: true } },
			owner: { select: { id: true, name: true, image: true } },
			poll: {
				select: {
					id: true,
					downvotes: { select: { id: true, name: true, image: true } },
					upvotes: { select: { id: true, name: true, image: true } },
					createdAt: true,
					updatedAt: true,
				},
			},
		},
	}) as GetPendingContributions[];
}

export type GetLatestContributionsOfModVersion = Prettify<Omit<Contribution, 'status'> & {
	status: typeof Status.ACCEPTED,
	coAuthors: PublicUser[],
	owner: PublicUser,
}>

export async function getLatestContributionsOfModVersion(modVersionId: string, res: Resolution, pack: Pack): Promise<GetLatestContributionsOfModVersion[]> {
	return db.resource.findMany({
		where: {
			modVersionId,
		},
		include: {
			linkedTextures: {
				include: {
					texture: {
						include: {
							contributions: {
								orderBy: {
									updatedAt: 'desc',
								},
								where: {
									status: Status.ACCEPTED,
									resolution: res,
									pack,
								},
								take: 1,
								include: {
									coAuthors: { select: { id: true, name: true, image: true } },
									owner: { select: { id: true, name: true, image: true } },
								},
							},
						},
					},
				},
			},
		},
	}).then((resources) =>
		resources
			.flatMap((r) => r.linkedTextures)
			.map((linkedTexture) => linkedTexture.texture)
			.unique((t1, t2) => t1.id === t2.id)
			.map((texture) => texture.contributions[0] as GetLatestContributionsOfModVersion)
			.filter((c) => !!c)
	);
}

// POST

export async function checkContributionStatus(contributionId: string) {
	await canAccess(UserRole.COUNCIL);

	const counselors = await getCounselors();
	const contribution = await db.contribution.findFirstOrThrow({
		where: { id: contributionId },
		include: {
			poll: {
				select: {
					upvotes: { select: { id: true } },
					downvotes: { select: { id: true } },
				},
			},
		},
	});

	// voting period ended
	if (contribution.poll.upvotes.length + contribution.poll.downvotes.length === counselors.length) {
		if (contribution.poll.upvotes.length >= contribution.poll.downvotes.length) {
			await db.contribution.update({
				where: { id: contributionId },
				data: { status: Status.ACCEPTED },
			});
		} else {
			await db.contribution.update({
				where: { id: contributionId },
				data: { status: Status.REJECTED },
			});
		}
	}
}

// DELETE

export async function deleteContributions(ownerId: string, ids: string[]) {
	await canAccess(UserRole.ADMIN, ownerId);

	const contributions = await db.contribution.findMany({
		where: { id: { in: ids } },
		include: { coAuthors: { select: { id: true } } },
	});

	for (const contribution of contributions) {
		await db.contribution.delete({ where: { id: contribution.id } });
		await db.poll.delete({ where: { id: contribution.pollId } });
	}
}
