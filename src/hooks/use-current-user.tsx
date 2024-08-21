import { useSession } from 'next-auth/react';

import type { ExtendedUser } from '../../next-auth';

/**
 * Get the current user from the session
 * @returns The current user or undefined if not logged in
 */
export const useCurrentUser = (): ExtendedUser | undefined => {
	const session = useSession();

	return session.data?.user;
};
