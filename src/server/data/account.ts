'use server';
import 'server-only';

import { db } from '~/lib/db';

import type { Account } from '@prisma/client';

// GET

export async function getAccountByUserId(userId: string): Promise<Account> {
	const account = await db.account.findFirst({ where: { userId } });

	if (account === null)
		throw new Error(`Account with id "${userId}" not found`);
	return account;
}
