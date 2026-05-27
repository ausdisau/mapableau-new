import type { MapAbleUserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  getCurrentUser,
  requireCurrentUser,
  type CurrentUser,
} from "@/lib/auth/current-user";
import type { Permission } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
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

export async function requireParticipantOrAdmin(
  participantUserId: string
): Promise<CurrentUser> {
  const user = await requireAuth();
  if (user.id === participantUserId) return user;
  if (isAdminRole(user.primaryRole)) return user;
  redirect("/dashboard");
}

export async function requireParticipantSelf(): Promise<CurrentUser> {
  const user = await requireAuth();
  if (user.primaryRole !== "participant" && !isAdminRole(user.primaryRole)) {
    redirect("/dashboard");
  }
  return user;
}

const MFA_STEP_UP_COOKIE = "mapable_mfa_step_up_at";
const MFA_STEP_UP_MAX_AGE_MS = 15 * 60 * 1000;

export async function hasMfaStepUp(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(MFA_STEP_UP_COOKIE)?.value;
  if (!value) return false;
  const ts = Number(value);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < MFA_STEP_UP_MAX_AGE_MS;
}

export async function setMfaStepUpPlaceholder(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(MFA_STEP_UP_COOKIE, String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MFA_STEP_UP_MAX_AGE_MS / 1000,
  });
}

export async function requirePrivilegedAuditAccess(): Promise<CurrentUser> {
  const user = await requirePermission("audit:read:privileged");
  const steppedUp = await hasMfaStepUp();
  if (!steppedUp) {
    redirect("/admin/audit/step-up");
  }
  return user;
}

export async function requireOrgScope(organisationId: string): Promise<CurrentUser> {
  const user = await requireAuth();
  if (isAdminRole(user.primaryRole)) return user;
  if (!hasPermission(user.primaryRole, "audit:read:org")) {
    redirect("/dashboard");
  }
  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(organisationId)) {
    redirect("/dashboard");
  }
  return user;
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

export async function withAuditRead<T>(params: {
  actorUserId: string;
  actorRole: string;
  entityType: string;
  entityId: string;
  participantId?: string;
  organisationId?: string;
  sensitivityLevel?: "public" | "internal" | "confidential" | "restricted";
  accessReason?: string;
  load: () => Promise<T>;
}): Promise<T> {
  const { logDataAccess } = await import("@/lib/audit/data-access-log-service");
  const data = await params.load();
  await logDataAccess({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole as MapAbleUserRole | undefined,
    entityType: params.entityType,
    entityId: params.entityId,
    participantId: params.participantId,
    organisationId: params.organisationId,
    sensitivityLevel: params.sensitivityLevel ?? "confidential",
    accessReason: params.accessReason ?? "Record viewed",
    result: "allowed",
  });
  return data;
}
