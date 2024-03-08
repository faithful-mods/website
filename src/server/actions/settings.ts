'use server';

import { User } from '@prisma/client';
import * as z from 'zod';

import { update } from '@/auth';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Accessing, loggedIn } from '@/lib/decorators';
import { UserSettingsSchema } from '@/schemas';
import { getUserById } from '@/server/data/user';

class UserSettings {
  @loggedIn()
	public static async updateUser(p: z.infer<typeof UserSettingsSchema>): Promise<Accessing<{ user: User }>> {
		const user = (await currentUser())!;
		const dbUser = await getUserById(user.id);

		if (!dbUser) {
			return { success: false, error: 'Unauthorized' }
		}

		const updatedUser = await db.user.update({
			where: { id: dbUser.id },
			data: {
				...p,
				role: dbUser.role, // don't allow changing role
			}
		});

		update({
			user: updatedUser,
		});

		// refresh logged in user
		await currentUser();

		return { success: true, result: { user: updatedUser } };
	}
}

export const { updateUser } = UserSettings;