'use server';
import 'server-only';

import { Status, UserRole } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';
import { calculateHash } from '~/lib/hash';

import { getCounselors } from './user';
import { remove, upload } from '../actions/files';

import type { Contribution, Resolution } from '@prisma/client';
import type {
	ContributionWithCoAuthors,
	ContributionWithCoAuthorsAndFullPoll,
	ContributionWithCoAuthorsAndPoll,
	TextureMCMETA,
} from '~/types';

// GET

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

export async function getContributionsOfTexture(textureId: string): Promise<ContributionWithCoAuthorsAndPoll[]> {
	return await db.contribution.findMany({
		where: { textureId, status: Status.ACCEPTED },
		include: {
			coAuthors: { select: { id: true, name: true, image: true } },
			owner: { select: { id: true, name: true, image: true } },
			poll: true,
		},
	});
}

export async function getCoSubmittedContributions(coAuthorId: string): Promise<ContributionWithCoAuthorsAndPoll[]> {
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

export async function getDraftContributions(ownerId: string): Promise<ContributionWithCoAuthors[]> {
	await canAccess(UserRole.ADMIN, ownerId);

	return await db.contribution.findMany({
		where: { ownerId, status: Status.DRAFT },
		include: {
			coAuthors: { select: { id: true, name: true, image: true } },
			owner: { select: { id: true, name: true, image: true } },
		},
	});
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

export async function findContribution(hash: string): Promise<Contribution | null> {
	return db.contribution.findFirst({
		where: { hash },
	});
}

// POST

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
		const buffer = await file.arrayBuffer();
		const hash = calculateHash(Buffer.from(buffer));

		if (await findContribution(hash)) throw new Error(`Contribution "${file.name}" has already been submitted`);
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
				hash,
			},
		});

		contributions.push(contribution);
	}

	return contributions.sort(
		(a, b) => a.createdAt.getTime() - b.createdAt.getTime()
	);
}

export async function updateContributionPicture(ownerId: string, contributionId: string, formData: FormData) {
	await canAccess(UserRole.ADMIN, ownerId);

	const file = formData.get('file') as File;
	const buffer = await file.arrayBuffer();
	const hash = calculateHash(Buffer.from(buffer));

	if (await findContribution(hash)) throw new Error(`Contribution "${file.name}" has already been submitted`);
	const filepath = await upload(file, `textures/contributions/${ownerId}/`);

	const oldFile = await db.contribution.findFirst({ where: { id: contributionId }, select: { file: true } });
	if (oldFile) await remove(oldFile.file as `/files/${string}`);

	const contribution = await db.contribution.update({ where: { id: contributionId }, data: { file: filepath, filename: file.name, hash, status: Status.DRAFT } });

	// reset poll
	await db.poll.update({
		where: { id: contribution.pollId },
		data: {
			upvotes: { set: [] },
			downvotes: { set: [] },
		},
	});

	return contribution;
}

export async function updateDraftContribution({
	ownerId,
	contributionId,
	coAuthors,
	resolution,
	textureId,
	mcmeta,
}: {
	ownerId: string;
	contributionId: string;
	coAuthors: string[];
	resolution: Resolution;
	textureId: string;
	mcmeta: TextureMCMETA;
}): Promise<ContributionWithCoAuthors> {
	await canAccess(UserRole.ADMIN, ownerId);

	const contribution = await db.contribution.update({
		where: { id: contributionId },
		data: {
			coAuthors: { set: coAuthors.map((id) => ({ id })) },
			resolution,
			textureId,
			mcmeta,
			status: Status.DRAFT,
		},
		include: {
			coAuthors: { select: { id: true, name: true, image: true } },
			owner: { select: { id: true, name: true, image: true } },
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

	return contribution;
}

export async function submitContributions(ownerId: string, ids: string[]) {
	await canAccess(UserRole.ADMIN, ownerId);

	return await db.contribution.updateMany({
		where: { id: { in: ids }, ownerId },
		data: { status: Status.PENDING },
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

export async function removeCoAuthor(ownerId: string, coAuthorId: string, contributionId: string) {
	await canAccess(UserRole.ADMIN, ownerId);

	return await db.contribution.update({
		where: { id: contributionId },
		data: { coAuthors: { disconnect: { id: coAuthorId } } },
	});
}

// DELETE

export async function deleteContributions(
	ownerId: string,
	ids: string[]
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
			await remove(contribution.file as `/files/${string}`);
			await db.contribution.delete({ where: { id: contribution.id } });
		}
	}
}
