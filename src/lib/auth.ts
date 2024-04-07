import { User, UserRole } from '@prisma/client';

import { auth } from '~/auth';

import { ExtendedUser } from '../../next-auth';

/**
 * Get the logged in user
 * @returns {Promise<User|undefined>} the logged in user, or undefined if not logged in
 */
export async function currentUser(): Promise<ExtendedUser | undefined> {
	const session = await auth();
	return session?.user;
};

/**
 * Get the logged in user's role
 * @returns {Promise<UserRole|undefined>} the user's role, or undefined if not logged in
 */
export async function currentRole(): Promise<UserRole | undefined> {
	const session = await auth();
	return session?.user?.role;
};

/**
 * Determine if the current user has a role, throws an error if not
 * @param {UserRole} role the role to check for
 */
export async function canAccess(role: UserRole = UserRole.ADMIN, self?: User['id']) {
	const session = await auth();
	if (!session || !session.user) throw new Error('Unauthorized');

	if (self && session?.user.id === self) return;
	if (session?.user.role === role || session?.user.role === UserRole.ADMIN) return;

	throw new Error('Forbidden, no permission');
}
