'use server';

import { Modpack, User, UserRole } from '@prisma/client';
import { z } from 'zod';

import { db } from '@/lib/db';
import { checkAccess, Accessing } from '@/lib/decorators';
import { toBase64 } from '@/lib/utils';
import { UpdateOrCreateModpackSchema, UpdateUserRoleSchema } from '@/schemas';

class Admin {
	@checkAccess()
	public static async getUsers(): Promise<Accessing<{ users: User[] }>> {
		return {
			success: true,
			result: { users: await db.user.findMany() },
		};
	}

	@checkAccess()
	public static async updateUserRole(p: z.infer<typeof UpdateUserRoleSchema>): Promise<Accessing<{ user: User }>> {
		const user = await db.user.update({
			where: { id: p.id },
			data: { role: p.role },
		});

		return { success: true, result: { user } };
	}

	public static async getModpacks(): Promise<Accessing<{ modpacks: Modpack[] }>> {
		return {
			success: true,
			result: { modpacks: await db.modpack.findMany() },
		};
	}

	@checkAccess()
	public static async updateOrCreateModpack(p: Omit<z.infer<typeof UpdateOrCreateModpackSchema>, 'image'> & { image?: string }): Promise<Accessing<{ modpack: Modpack }>> {
		const data = {
			name: p.name,
			image: p.image,
		}
		
		if (p.id) {
			return {
				success: true,
				result: { 
					modpack: await db.modpack.update({ where: { id: p.id }, data }) 
				},
			};
		}

		return {
			success: true,
			result: { modpack: await db.modpack.create({ data }) },
		};
	}
}

export const { getUsers, updateUserRole, getModpacks, updateOrCreateModpack } = Admin;
