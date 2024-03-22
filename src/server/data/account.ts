'use server';

import { Account } from '@prisma/client';

import { db } from '@/lib/db';

export async function getAccountByUserId(userId: string): Promise<Account> {
	const account = await db.account.findFirst({ where: { userId } });
	
	if (account === null) throw new Error(`Account with id "${userId}" not found`);
	return account;
};
