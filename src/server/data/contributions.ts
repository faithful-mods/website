'use server';
import 'server-only';

import { Status, UserRole } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';

import { getCounselors } from './user';

import type { GitFile } from '../actions/git';
import type { Contribution, Resolution } from '@prisma/client';
import type { Prettify, PublicUser } from '~/types';

// GET

export type GetContributionsOfUser = Prettify<Contribution & {
	coAuthors: PublicUser[],
	owner: PublicUser,
	poll: {
		upvotes: PublicUser[],
		downvotes: PublicUser[],
	}
}>

/**
 * Get all contributions of a user, including the co-authors and the poll
 */
export async function getContributionsOfUser(ownerId: string, resolution: Resolution): Promise<GetContributionsOfUser[]> {
	await canAccess(UserRole.ADMIN, ownerId);

	return await db.contribution.findMany({
		where: { ownerId, resolution },
		include: {
			coAuthors: { select: { id: true, name: true, image: true } },
			owner: { select: { id: true, name: true, image: true } },
			poll: { select: { downvotes: true, upvotes: true } },
		},
	});
}

export type GetPendingContributions = Prettify<Omit<Contribution, 'status'> & {
	status: typeof Status.PENDING,
	coAuthors: PublicUser[],
	owner: PublicUser,
	poll: {
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

export async function getLatestContributionsOfModVersion(modVersionId: string, res: Resolution): Promise<GetLatestContributionsOfModVersion[]> {
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

export async function submitContributions(ownerId: string, contributionsIds: string[]) {
	await canAccess(UserRole.ADMIN, ownerId);

	await db.contribution.updateMany({
		where: { id: { in: contributionsIds }, ownerId },
		data: { status: Status.PENDING },
	});
}

export async function archiveContributions(ownerId: string, contributionsIds: string[]) {
	await canAccess(UserRole.ADMIN, ownerId);

	await db.contribution.updateMany({
		where: { id: { in: contributionsIds }, ownerId },
		data: { status: Status.ARCHIVED },
	});
}

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

export async function createContributionsFromGitFiles(ownerId: string, resolution: Resolution, files: GitFile[]) {
	await canAccess(UserRole.ADMIN, ownerId);

	for (const file of files) {
		const existingContribution = await db.contribution.findFirst({ where: { hash: file.sha } });
		if (existingContribution) continue;

		const hash = (file.path.includes('/') ? file.path.split('/')[1] : file.path)?.replace('.png', '');
		const texture = await db.texture.findFirst({ where: { hash } });

		if (!texture) continue;

		const poll = await db.poll.create({ data: {} });
		const contribution = await db.contribution.create({
			data: {
				ownerId,
				filepath: file.url,
				hash: file.sha,
				status: Status.DRAFT,
				pollId: poll.id,
				filename: file.path,
				resolution,
				textureId: texture.id,
			},
		});

		// reset poll
		await db.poll.update({
			where: { id: contribution.pollId },
			data: {
				upvotes: { set: [] },
				downvotes: { set: [] },
			},
		});
	}
}

// DELETE

export async function deleteContributionsOrArchive(
	ownerId: string,
	ids: string[]
): Promise<void> {
	await canAccess(UserRole.ADMIN, ownerId);

	const contributions = await db.contribution.findMany({
		where: { id: { in: ids } },
		include: { coAuthors: { select: { id: true } } },
	});

	for (const contribution of contributions) {
		// removed from git without being accepted
		if (contribution.status !== Status.ACCEPTED && contribution.status !== Status.ARCHIVED) {
			await db.contribution.delete({ where: { id: contribution.id } });
			await db.poll.delete({ where: { id: contribution.pollId } });
		}
		else {
			await db.contribution.update({
				where: { id: contribution.id },
				data: { status: Status.ARCHIVED },
			});
		}
	}
}

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
