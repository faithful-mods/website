import * as z from 'zod';
import { UserRole } from '@prisma/client';

export const UserSettingsSchema = z.object({
	name: z.optional(z.string()),
	role: z.enum([UserRole.ADMIN, UserRole.USER, UserRole.BANNED]),
})

export const UpdateUserRoleSchema = z.object({
	id: z.string(),
	role: z.enum([UserRole.ADMIN, UserRole.USER, UserRole.BANNED]),
});
