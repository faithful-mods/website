'use server';

import { User } from '@prisma/client';
import * as z from 'zod';

import { update } from '@/auth';
import { db } from '@/lib/db';
import { Accessing, loggedIn } from '@/lib/decorators';
import { UserSettingsSchema } from '@/schemas';
import { getUserById } from '@/server/data/user';

class UserSettings {
  @loggedIn()
	public static async updateUser(p: z.infer<typeof UserSettingsSchema>, id: string): Promise<Accessing<{ user: User }>> {
		const dbUser = await getUserById(id);

		if (!dbUser) {
			return { success: false, error: 'Unauthorized' }
		}

		const updatedUser = await db.user.update({
			where: { id },
			data: {
				...p,
				role: dbUser.role, // don't allow changing role
			}
		});

		update({
			user: updatedUser,
		});

		return { success: true, result: { user: updatedUser } };
	}
}

export const { updateUser } = UserSettings;