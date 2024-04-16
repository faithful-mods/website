'use server';
import 'server-only';

import { signOut } from '~/auth';

export const logout = async () => {
	await signOut({ redirectTo: '/' });
};
