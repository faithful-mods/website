'use server';
import 'server-only';

import {
	Status,
	type Contribution,
	type Resolution,
	UserRole,
} from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';
import {
	ContributionWithCoAuthors,
	ContributionWithCoAuthorsAndFullPoll,
	ContributionWithCoAuthorsAndPoll,
} from '~/types';

import { getCounselors } from './user';
import { remove, upload } from '../actions/files';

export async function getSubmittedContributions(
	ownerId: string
): Promise<ContributionWithCoAuthorsAndPoll[]> {
	await canAccess(UserRole.ADMIN, ownerId);

	return await db.contribution.findMany({
		where: { ownerId, status: { not: Status.DRAFT } },
		include: {
			coAuthors: { select: { id: true, name: true, image: true } },
			owner: { select: { id: true, name: true, image: true } },
			poll: true,
		},
	});
}

export async function createRawContributions(
	ownerId: string,
	coAuthors: string[],
	resolution: Resolution,
	data: FormData
): Promise<Contribution[]> {
	await canAccess(UserRole.ADMIN, ownerId);
	const files = data.getAll('files') as File[];

	const contributions: Contribution[] = [];
	for (const file of files) {
		const filepath = await upload(file, `textures/contributions/${ownerId}/`);

		const poll = await db.poll.create({ data: {} });
		const contribution = await db.contribution.create({
			data: {
				ownerId,
				coAuthors: { connect: coAuthors.map((id) => ({ id })) },
				resolution,
				file: filepath,
				filename: file.name,
				pollId: poll.id,
			},
		});

		contributions.push(contribution);
	}

	return contributions.sort(
		(a, b) => a.createdAt.getTime() - b.createdAt.getTime()
	);
}

export async function getContributionsOfTexture(
	textureId: string
): Promise<ContributionWithCoAuthorsAndPoll[]> {
	return await db.contribution.findMany({
		where: { textureId, status: Status.ACCEPTED },
		include: {
			coAuthors: { select: { id: true, name: true, image: true } },
			owner: { select: { id: true, name: true, image: true } },
			poll: true,
		},
	});
}

export async function getCoSubmittedContributions(
	coAuthorId: string
): Promise<ContributionWithCoAuthorsAndPoll[]> {
	return await db.contribution.findMany({
		where: {
			coAuthors: { some: { id: coAuthorId } },
			status: { not: Status.DRAFT },
		},
		include: {
			coAuthors: { select: { id: true, name: true, image: true } },
			owner: { select: { id: true, name: true, image: true } },
			poll: true,
		},
	});
}

export async function getDraftContributions(
	ownerId: string
): Promise<ContributionWithCoAuthors[]> {
	await canAccess(UserRole.ADMIN, ownerId);

	return await db.contribution.findMany({
		where: { ownerId, status: Status.DRAFT },
		include: {
			coAuthors: { select: { id: true, name: true, image: true } },
			owner: { select: { id: true, name: true, image: true } },
		},
	});
}

export async function updateDraftContribution({
	ownerId,
	contributionId,
	coAuthors,
	resolution,
	textureId,
}: {
	ownerId: string;
	contributionId: string;
	coAuthors: string[];
	resolution: Resolution;
	textureId: string;
}): Promise<ContributionWithCoAuthors> {
	await canAccess(UserRole.ADMIN, ownerId);

	return await db.contribution.update({
		where: { id: contributionId },
		data: {
			coAuthors: { set: coAuthors.map((id) => ({ id })) },
			resolution,
			textureId,
		},
		include: {
			coAuthors: { select: { id: true, name: true, image: true } },
			owner: { select: { id: true, name: true, image: true } },
		},
	});
}

export async function submitContribution(ownerId: string, id: string) {
	await canAccess(UserRole.ADMIN, ownerId);

	return await db.contribution.update({
		where: { id },
		data: { status: Status.PENDING },
	});
}

export async function deleteContributions(
	ownerId: string,
	...ids: string[]
): Promise<void> {
	await canAccess(UserRole.ADMIN, ownerId);

	const contributions = await db.contribution.findMany({
		where: { id: { in: ids } },
		include: { coAuthors: { select: { id: true } } },
	});

	for (const contribution of contributions) {
		// Case co-author wants to be removed from the contribution
		if (
			contribution.ownerId !== ownerId &&
			contribution.coAuthors.map((c) => c.id).includes(ownerId)
		) {
			await db.contribution.update({
				where: { id: contribution.id },
				data: { coAuthors: { disconnect: { id: ownerId } } },
			});
		}

		// Base case: owner wants to delete the contribution
		if (contribution.ownerId === ownerId) {
			await remove(contribution.file as `files/${string}`);
			await db.contribution.delete({ where: { id: contribution.id } });
		}
	}
}

export async function getPendingContributions(): Promise<ContributionWithCoAuthorsAndFullPoll[]> {
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
	if (
		contribution.poll.upvotes.length + contribution.poll.downvotes.length ===
		counselors.length
	) {
		if (contribution.poll.upvotes.length > contribution.poll.downvotes.length) {
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
