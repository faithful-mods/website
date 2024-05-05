'use server';
import 'server-only';

import { UserRole } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';
import type { PollResults } from '~/types';

// GET

export async function getPollResult(id: string): Promise<PollResults> {
	const res = await db.poll.findFirstOrThrow({ where: { id }, include: { upvotes: true, downvotes: true } });
	return {
		upvotes: res.upvotes.length,
		downvotes: res.downvotes.length,
	};
}

// POST

export async function editPollChoice(pollId: string, userId: string, kind: 'up' | 'down' | 'none') {
	await canAccess(UserRole.COUNCIL);

	switch (kind) {
		case 'up':
			await db.poll.update({
				where: { id: pollId },
				data: {
					upvotes: { connect: { id: userId } },
					downvotes: { disconnect: { id: userId } },
				},
			});
			break;

		case 'down':
			await db.poll.update({
				where: { id: pollId },
				data: {
					upvotes: { disconnect: { id: userId } },
					downvotes: { connect: { id: userId } },
				},
			});
			break;

		case 'none':
			await db.poll.update({
				where: { id: pollId },
				data: {
					upvotes: { disconnect: { id: userId } },
					downvotes: { disconnect: { id: userId } },
				},
			});
			break;
	}
}
