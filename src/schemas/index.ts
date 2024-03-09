import { UserRole } from '@prisma/client';
import * as z from 'zod';

export const UserSettingsSchema = z.object({
	name: z.optional(z.string()),
	image: z.optional(z.string()),
})

export const UpdateUserRoleSchema = z.object({
	id: z.string(),
	role: z.enum([UserRole.ADMIN, UserRole.USER, UserRole.BANNED]),
});

export const UpdateOrCreateModpackSchema = z.object({
	id: z.optional(z.string()),
	name: z.string(),
	image: z.instanceof(File).optional(),
});
