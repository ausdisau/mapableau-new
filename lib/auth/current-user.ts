import type { MapAbleUserRole } from "@prisma/client";

import { getAuthSessionStatus } from "@/lib/auth/auth-session-status";
import type { UserRole } from "@/types/mapable";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  timezone: string;
  locale: string;
  primaryRole: UserRole;
  roles: UserRole[];
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const status = await getAuthSessionStatus();
  if (status.status !== "registered") return null;
  return status.user;
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function userHasRole(
  user: CurrentUser,
  role: UserRole | MapAbleUserRole
): boolean {
  return user.roles.includes(role as UserRole);
}

export { toCurrentUser } from "@/lib/auth/auth-session-status";
