'use server';

import { Status, type Contribution, type Resolution, UserRole } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';
import { ContributionWithCoAuthors, ContributionWithCoAuthorsAndPoll } from '~/types';

import { remove, upload } from '../actions/files';

export async function getSubmittedContributions(ownerId: string): Promise<ContributionWithCoAuthors[]> {
	await canAccess(UserRole.ADMIN, ownerId);

	return await db.contribution.findMany({
		where: { ownerId, status: { not: Status.DRAFT } },
		include: { coAuthors: { select: { id: true, name: true, image: true } } },
	});
}

export async function createRawContributions(ownerId: string, coAuthors: string[], resolution: Resolution, data: FormData): Promise<Contribution[]> {
	await canAccess(UserRole.ADMIN, ownerId);
	const files = data.getAll('files') as File[];

	const contributions: Contribution[] = [];
	for (const file of files) {
		const filepath = await upload(file, `textures/contributions/${ownerId}/`)

		const poll = await db.poll.create({ data: {} });
		const contribution = await db.contribution.create({
			data: {
				ownerId,
				coAuthors: { connect: coAuthors.map((id) => ({ id })) },
				resolution,
				file: filepath,
				filename: file.name,
				pollId: poll.id,
			}
		})

		contributions.push(contribution);
	}

	return contributions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function getContributionsOfTexture(
	textureId: string
): Promise<ContributionWithCoAuthorsAndPoll[]> {
	return await db.contribution.findMany({
		where: { textureId, status: Status.ACCEPTED },
		include: { coAuthors: { select: { id: true, name: true, image: true } }, poll: true },
	});
}

export async function getDraftContributions(ownerId: string): Promise<ContributionWithCoAuthors[]> {
	await canAccess(UserRole.ADMIN, ownerId);

	return await db.contribution.findMany({
		where: { ownerId, status: Status.DRAFT },
		include: { coAuthors: { select: { id: true, name: true, image: true } } },
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
		include: { coAuthors: { select: { id: true, name: true, image: true } } },
	});
}

export async function deleteContribution(id: string): Promise<Contribution> {
	const contributionFile = await db.contribution.findUnique({ where: { id } }).then((c) => c?.file);
	if (contributionFile) await remove(contributionFile as `files/${string}`);

	return await db.contribution.delete({ where: { id } });
}
