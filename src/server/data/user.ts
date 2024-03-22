'use server';

import { User, UserRole } from '@prisma/client';

import { canAccess } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * Get all users from the database
 * @returns {Promise<User[]>} - A promise that resolves to an array of users 
 */
export async function getUsers(): Promise<User[]> {
	await canAccess();
	return db.user.findMany();
}

/**
 * Update a user's role
 * @param {string} id the user to update
 * @param {UserRole} role the new role
 * @returns {User} the updated user
 */
export async function updateUserRole(id: string, role: UserRole): Promise<User> {
	await canAccess();
	return db.user.update({ where: { id }, data: { role } });
}

/**
 * Find a user by their email
 * @param {string} email the email to search for
 * @returns {User} the found user
 */
export async function getUserByEmail(email: string): Promise<User> {
	const res = await db.user.findUnique({ where: { email } });
	if (res === null) throw new Error(`User with id "${email}" not found`);

	return res;
};

export async function getUserById(id: string): Promise<User> {
	const res = await db.user.findUnique({ where: { id } });
	if (res === null) throw new Error(`User with id "${id}" not found`);

	return res;
};
