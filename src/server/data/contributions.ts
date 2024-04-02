'use server';

import { Status, type Contribution, type Resolution } from '@prisma/client';

import { db } from '~/lib/db';
import { ContributionWithCoAuthors } from '~/types';

import { upload } from '../actions/files';

export async function getSubmittedContributions(ownerId: string): Promise<ContributionWithCoAuthors[]> {
	return await db.contribution.findMany({
		where: { ownerId, status: { not: Status.DRAFT } },
		include: { coAuthors: { select: { id: true, name: true, image: true } } },
	});
}

export async function createRawContributions(ownerId: string, coAuthors: string[], resolution: Resolution, data: FormData): Promise<Contribution[]> {
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

	return contributions;
}

export async function getDraftContributions(ownerId: string): Promise<ContributionWithCoAuthors[]> {
	return await db.contribution.findMany({
		where: { ownerId, status: Status.DRAFT },
		include: { coAuthors: { select: { id: true, name: true, image: true } } },
	});
}
