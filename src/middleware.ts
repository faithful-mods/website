import NextAuth from 'next-auth';

import authConfig from '~/auth.config';
import {
	AUTH_API_PREFIX,
	PUBLIC_ROUTES,
} from '~/routes';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
	const { nextUrl } = req;
	const isLoggedIn = !!req.auth;

	const isApiAuthRoute = nextUrl.pathname.startsWith(AUTH_API_PREFIX);
	const isPublicRoute  = PUBLIC_ROUTES.some((route) => nextUrl.pathname.startsWith(route));

	if (isApiAuthRoute) return;

	if (!isLoggedIn && !isPublicRoute)
		return Response.redirect(new URL('/not-found', nextUrl));

	return;
});

// Optionally, don't invoke Middleware on some paths
export const config = {
	matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};