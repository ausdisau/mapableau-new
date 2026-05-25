import type { CurrentUser } from "@/lib/auth/current-user";
import { getApiUser, apiForbidden, apiUnauthorized } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { requireConsentScope } from "@/lib/access/consent-aware-access";
import { requireOrganisationAccess } from "@/lib/access/organisation-access-policy";
import { requireRole } from "@/lib/access/role-policy";
import {
  AccessDeniedError,
  UnauthenticatedError,
  safeAccessDeniedResponse,
  safeNotFoundResponse,
} from "@/lib/errors/access-errors";
import { logAuditEvent } from "@/lib/audit/audit-service";
import type { PlatformConsentScope } from "@/types/consent";
import type { UserRole } from "@/types/mapable";

export async function requireAuthenticatedUser(): Promise<CurrentUser> {
  const user = await getApiUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}

export function requireRoleAccess(
  user: CurrentUser,
  ...roles: UserRole[]
): void {
  if (!requireRole(user, ...roles) && !isAdminRole(user.primaryRole)) {
    throw new AccessDeniedError();
  }
}

export async function requireParticipantAccess(
  actor: CurrentUser,
  participantId: string,
  options?: { consentScope?: PlatformConsentScope; hideExistence?: boolean }
): Promise<void> {
  if (actor.id === participantId) return;
  if (isAdminRole(actor.primaryRole)) return;

  if (options?.consentScope) {
    const allowed = await requireConsentScope({
      actor,
      subjectProfileId: participantId,
      scope: options.consentScope,
    });
    if (!allowed) {
      await logAuditEvent({
        actorUserId: actor.id,
        actorRole: actor.primaryRole,
        action: "access.denied",
        entityType: "participant",
        participantId,
        metadata: { scope: options.consentScope },
      });
      if (options.hideExistence) throw new AccessDeniedError();
      throw new AccessDeniedError();
    }
    return;
  }

  throw new AccessDeniedError();
}

export async function requireOrganisationAccessForUser(
  user: CurrentUser,
  organisationId: string
): Promise<void> {
  if (isAdminRole(user.primaryRole)) return;
  await requireOrganisationAccess(user.id, organisationId);
}

export async function requireConsentScopeAccess(
  actor: CurrentUser,
  subjectProfileId: string,
  scope: PlatformConsentScope,
  opts?: { organisationId?: string }
): Promise<void> {
  const allowed = await requireConsentScope({
    actor,
    subjectProfileId,
    scope,
    grantedToOrganisationId: opts?.organisationId,
  });
  if (!allowed) throw new AccessDeniedError();
}

export {
  apiUnauthorized,
  apiForbidden,
  safeAccessDeniedResponse,
  safeNotFoundResponse,
};
