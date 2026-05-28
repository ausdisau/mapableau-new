import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";
import { apiForbidden, apiUnauthorized } from "@/lib/auth/guards";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { canUseOperationalWorkerPermissions } from "@/lib/workers/worker-org-access";

export async function requireApiSession(): Promise<
  CurrentUser | Response
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return apiUnauthorized();
  const user = await getCurrentUser();
  if (!user) return apiUnauthorized();
  return user;
}

export async function requireApiPermission(
  permission: Permission
): Promise<CurrentUser | Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, permission)) return apiForbidden();
  return user;
}

/** Care shift / timesheet mutations for verified support workers only. */
export async function requireApiVerifiedWorkerOperations(
  permission: "care:shift:work" | "timesheet:manage:org"
): Promise<CurrentUser | Response> {
  const user = await requireApiPermission(permission);
  if (user instanceof Response) return user;
  if (!(await canUseOperationalWorkerPermissions(user.id, user.primaryRole))) {
    return apiForbidden(
      "Worker profile must be verified before shift or timesheet actions"
    );
  }
  return user;
}

export async function requireApiAdmin(): Promise<CurrentUser | Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isAdminRole(user.primaryRole)) return apiForbidden();
  return user;
}
