import { requireApiSession } from "@/lib/api/auth-handler";
import { apiForbidden } from "@/lib/auth/guards";
import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";

/** Participants and transport operators may read public transport data. */
export async function requirePtReadAccess(): Promise<CurrentUser | Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (
    hasPermission(user.primaryRole, "transport:read:org") ||
    hasPermission(user.primaryRole, "transport:read:self")
  ) {
    return user;
  }
  return apiForbidden();
}
