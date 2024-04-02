'use server';

import { User, UserRole } from '@prisma/client';

import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';
import type { PublicUser } from '~/types';

/**
 * Get all users from the database
 * @returns {Promise<User[]>} - A promise that resolves to an array of users 
 */
export async function getUsers(): Promise<User[]> {
	await canAccess();
	return db.user.findMany();
}

export async function getPublicUsers(): Promise<PublicUser[]> {
	const users = await db.user.findMany({ where: { role: { not: UserRole.BANNED }}, orderBy: { name: 'asc' }});

	return users
		.filter((user) => user.name !== null)
		.map((user) => ({
			id: user.id,
			name: user.name ?? 'Unknown', // This should never happen (filtered above)
			image: user.image ?? '/icon.png',
		}));
}

/**
 * Update a user's role
 * @param {string} id the user to update
 * @param {UserRole} role the new role
 * @returns {Promise<User>} the updated user
 */
export async function updateUserRole(id: string, role: UserRole): Promise<User> {
	await canAccess();
	return db.user.update({ where: { id }, data: { role } });
}

/**
 * Update a user's data
 * @param {User} data the new user data
 * @returns {Promise<User>} the updated user
 */
export async function updateUser(data: Partial<User> & { id: string }): Promise<User> {
	await canAccess(UserRole.ADMIN, data.id);

	const user = await db.user.findUnique({ where: { id: data.id } });
	if (!user) throw new Error('User not found');

	return db.user.update({ where: { id: data.id }, data: { ...data, role: user.role } });
}

/**
 * Find a user by their email
 * @param {string} email the email to search for
 * @returns {Promise<User>} the found user
 */
export async function getUserByEmail(email: string): Promise<User> {
	const res = await db.user.findUnique({ where: { email } });
	if (res === null) throw new Error(`User with id "${email}" not found`);

	return res;
};

/**
 * Find a user by their id
 * @param {string} id the id to search for
 * @returns {Promise<User>} the found user
 */
export async function getUserById(id: string): Promise<User> {
	const res = await db.user.findUnique({ where: { id } });
	if (res === null) throw new Error(`User with id "${id}" not found`);

	return res;
};
