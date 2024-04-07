'use server';

import { db } from '~/lib/db';
import type { PollResults } from '~/types';

export async function getPollResult(id: string): Promise<PollResults> {
	const res = await db.poll.findFirstOrThrow({ where: { id }, include: { upvotes: true, downvotes: true } });
	return {
		upvotes: res.upvotes.length,
		downvotes: res.downvotes.length,
	};
}