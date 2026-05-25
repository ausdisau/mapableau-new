import { hasActiveConsentForCoordinator } from "@/lib/support-coordinator/consent-gate";
import { hasPlanManagerAccess } from "@/lib/plan-manager/plan-manager-access-policy";
import { hasNomineeScope } from "@/lib/family/family-permission-policy";
import { canAccessOwnParticipantData, canAccessAsAdmin } from "@/lib/access/role-policy";
import type { UserRole } from "@/types/mapable";
import type { NomineePermissionScope } from "@prisma/client";

import { logDataAccess } from "./data-access-logger";

export type ConsentAccessResult =
  | { allowed: true; consentStatus: "active" | "self" | "admin" }
  | { allowed: false; reason: "no_consent" | "no_link" | "scope_missing" | "no_permission" };

export async function checkCoordinatorParticipantAccess(params: {
  coordinatorId: string;
  participantId: string;
  actorRole: UserRole;
}): Promise<ConsentAccessResult> {
  if (canAccessOwnParticipantData(params.coordinatorId, params.participantId)) {
    return { allowed: true, consentStatus: "self" };
  }
  if (canAccessAsAdmin(params.actorRole)) {
    return { allowed: true, consentStatus: "admin" };
  }

  const hasConsent = await hasActiveConsentForCoordinator(
    params.participantId,
    params.coordinatorId
  );
  if (!hasConsent) {
    return { allowed: false, reason: "no_consent" };
  }
  return { allowed: true, consentStatus: "active" };
}

export async function checkPlanManagerParticipantAccess(params: {
  planManagerId: string;
  participantId: string;
  actorRole: UserRole;
}): Promise<ConsentAccessResult> {
  if (canAccessAsAdmin(params.actorRole)) {
    return { allowed: true, consentStatus: "admin" };
  }

  const hasLink = await hasPlanManagerAccess(
    params.participantId,
    params.planManagerId
  );
  if (!hasLink) {
    return { allowed: false, reason: "no_link" };
  }
  return { allowed: true, consentStatus: "active" };
}

export async function checkNomineeParticipantAccess(params: {
  nomineeId: string;
  participantId: string;
  requiredScope: NomineePermissionScope;
  actorRole: UserRole;
}): Promise<ConsentAccessResult> {
  if (canAccessOwnParticipantData(params.nomineeId, params.participantId)) {
    return { allowed: true, consentStatus: "self" };
  }
  if (canAccessAsAdmin(params.actorRole)) {
    return { allowed: true, consentStatus: "admin" };
  }

  const hasScope = await hasNomineeScope({
    nomineeId: params.nomineeId,
    participantId: params.participantId,
    scope: params.requiredScope,
  });
  if (!hasScope) {
    return { allowed: false, reason: "scope_missing" };
  }
  return { allowed: true, consentStatus: "active" };
}

export async function checkParticipantSelfAccess(params: {
  actorUserId: string;
  participantId: string;
  actorRole: UserRole;
}): Promise<ConsentAccessResult> {
  if (canAccessOwnParticipantData(params.actorUserId, params.participantId)) {
    return { allowed: true, consentStatus: "self" };
  }
  if (canAccessAsAdmin(params.actorRole)) {
    return { allowed: true, consentStatus: "admin" };
  }
  return { allowed: false, reason: "no_permission" };
}

export async function logConsentGatedAccess(params: {
  actorUserId: string;
  actorRole: UserRole;
  participantId: string;
  resourceType: string;
  resourceId?: string;
  action: string;
  accessResult: ConsentAccessResult;
}): Promise<void> {
  await logDataAccess({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    participantId: params.participantId,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    action: params.action,
    consentStatus:
      params.accessResult.allowed
        ? params.accessResult.consentStatus === "self" ||
          params.accessResult.consentStatus === "admin"
          ? "active"
          : "active"
        : "missing",
  });
}
