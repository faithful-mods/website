import { UserRole } from "@prisma/client";
import { currentRole, currentUser } from "./auth";

export function checkAccess(role: UserRole = 'ADMIN') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const roles = ['ADMIN', await currentRole()]; // let 'ADMIN' access everything
      if (!roles.includes(role)) return { success: false, error: "Forbidden, no permission" };

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

export function loggedIn() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      if (!await currentUser()) return { success: false, error: 'Unauthorized, you must be logged in.' };

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

export interface NoAccess {
  success: false;
  error: string;
}

export interface Access<T> {
  success: true;
  result: T;
}

export type Accessing<T> = Access<T> | NoAccess;
