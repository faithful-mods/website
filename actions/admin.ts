"use server";

import { db } from "@/lib/db";
import { checkAccess, Accessing } from "@/lib/decorators";
import { UpdateUserRoleSchema } from "@/schemas";
import { User, UserRole } from "@prisma/client";
import { z } from "zod";

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
}

export const { getUsers, updateUserRole } = Admin;
