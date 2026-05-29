import { redirect } from "next/navigation";

import {
  getCurrentUser,
  requireCurrentUser,
  type CurrentUser,
} from "@/lib/auth/current-user";
import type { Permission } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import {
  isWorkerProfileComplete,
  workerOnboardingPath,
  workerProfilePath,
} from "@/lib/workers/profile-completion";
import { getPrimaryWorkerProfileForUser } from "@/lib/workers/worker-profile-service";
import {
  canUseOperationalWorkerPermissions,
  isOperationalWorkerPermission,
} from "@/lib/workers/worker-org-access";
import type { UserRole } from "@/types/mapable";

export async function requireAuth(redirectTo = "/login"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireAuth();
  if (!isAdminRole(user.primaryRole)) redirect("/dashboard");
  return user;
}

export async function requirePermission(
  permission: Permission
): Promise<CurrentUser> {
  const user = await requireAuth();
  if (!hasPermission(user.primaryRole, permission)) {
    redirect("/dashboard");
  }
  return user;
}

export async function requireVerifiedWorkerOperations(
  permission: "care:shift:work" | "timesheet:manage:org"
): Promise<CurrentUser> {
  if (!isOperationalWorkerPermission(permission)) {
    return requirePermission(permission);
  }
  const user = await requirePermission(permission);
  if (await canUseOperationalWorkerPermissions(user.id, user.primaryRole)) {
    return user;
  }

  const profile = await getPrimaryWorkerProfileForUser(user.id);
  if (!profile || !isWorkerProfileComplete(profile)) {
    redirect(workerOnboardingPath());
  }
  redirect(workerProfilePath());
}

export async function requireParticipantOrAdmin(
  participantUserId: string
): Promise<CurrentUser> {
  const user = await requireAuth();
  if (user.id === participantUserId) return user;
  if (isAdminRole(user.primaryRole)) return user;
  redirect("/dashboard");
}

export function apiUnauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function apiForbidden(message = "Forbidden") {
  return Response.json({ error: message }, { status: 403 });
}

export async function getApiUser(): Promise<CurrentUser | null> {
  try {
    return await requireCurrentUser();
  } catch {
    return null;
  }
}

export function apiRequireRole(
  user: CurrentUser,
  ...roles: UserRole[]
): boolean {
  return roles.some((r) => user.roles.includes(r));
}
