import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import {
  coordinatorHasScope,
  hasActiveConsentForCoordinator,
} from "@/lib/support-coordinator/consent-gate";

export class CareSupportAccessError extends Error {
  constructor(
    message: string,
    public code: "FORBIDDEN" | "CONSENT_REQUIRED" = "FORBIDDEN"
  ) {
    super(message);
    this.name = "CareSupportAccessError";
  }
}

export function assertParticipantSelf(user: CurrentUser, participantId: string) {
  if (user.id !== participantId && !isAdminRole(user.primaryRole)) {
    throw new CareSupportAccessError("FORBIDDEN");
  }
}

export function assertParticipantSelfById(actorUserId: string, participantId: string) {
  if (actorUserId !== participantId) {
    throw new CareSupportAccessError("FORBIDDEN");
  }
}

export async function assertCoordinatorCanAccessParticipant(
  coordinatorId: string,
  participantId: string,
  scope?: string
) {
  const active = await hasActiveConsentForCoordinator(participantId, coordinatorId);
  if (!active) {
    throw new CareSupportAccessError("CONSENT_REQUIRED", "CONSENT_REQUIRED");
  }
  if (scope) {
    const scoped = await coordinatorHasScope(participantId, coordinatorId, scope);
    if (!scoped) {
      throw new CareSupportAccessError("CONSENT_REQUIRED", "CONSENT_REQUIRED");
    }
  }
}

export function canManageCareSupportSelf(user: CurrentUser): boolean {
  return hasPermission(user.primaryRole, "care:manage:self");
}

export function canUseCoordinatorPortal(user: CurrentUser): boolean {
  return hasPermission(user.primaryRole, "coordinator:portal");
}
