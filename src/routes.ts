/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 */
export const PUBLIC_ROUTES = ['/', '/modpacks', '/mods', '/gallery', '/not-found'] as const;

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 */
export const AUTH_API_PREFIX = '/api/auth' as const;

/**
 * The default redirect path after logging in
 */
export const DEFAULT_LOGIN_REDIRECT = '/' as const;
