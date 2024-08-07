import Github from 'next-auth/providers/github';

import type { NextAuthConfig } from 'next-auth';

/**
 * For callback URLs: http://localhost:3000/api/auth/providers
 */
export default {
	providers: [
		Github({
			clientId: process.env.GITHUB_CLIENT_ID,
			clientSecret: process.env.GITHUB_CLIENT_SECRET,
		}),
	],
} satisfies NextAuthConfig;
