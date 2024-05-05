'use server';
import 'server-only';

import { Account } from '@prisma/client';

import { db } from '~/lib/db';

// GET

export async function getAccountByUserId(userId: string): Promise<Account> {
	const account = await db.account.findFirst({ where: { userId } });

	if (account === null)
		throw new Error(`Account with id "${userId}" not found`);
	return account;
}
