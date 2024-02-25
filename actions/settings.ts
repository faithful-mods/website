"use server";

import * as z from "zod";

import { update } from "@/auth";
import { db } from "@/lib/db";
import { UserSettingsSchema } from "@/schemas";
import { getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth";
import { Accessing, loggedIn } from "@/lib/decorators";
import { User } from "@prisma/client";

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
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
      }
    });

    return { success: true, result: { user: updatedUser } };
  }
}

export const { updateUser } = UserSettings;