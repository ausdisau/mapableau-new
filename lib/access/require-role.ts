import { redirect } from "next/navigation";

import type { CurrentUser } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import type { UserRole } from "@/types/mapable";

export async function requireRole(
  ...roles: UserRole[]
): Promise<CurrentUser> {
  const user = await requireAuth();
  const allowed = roles.some((r) => user.roles.includes(r));
  if (!allowed) redirect("/dashboard");
  return user;
}

export async function requireAdminRole(): Promise<CurrentUser> {
  const user = await requireAuth();
  if (!isAdminRole(user.primaryRole)) redirect("/dashboard");
  return user;
}
