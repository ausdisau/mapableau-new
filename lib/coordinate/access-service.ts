import type { MapAbleUserRole } from "@prisma/client";

import { isAdminRole } from "@/lib/auth/roles";
import { hasActiveConsentForCoordinator } from "@/lib/support-coordinator/consent-gate";
import type { UserRole } from "@/types/mapable";

export class CoordinateAccessError extends Error {
  constructor(message = "FORBIDDEN") {
    super(message);
    this.name = "CoordinateAccessError";
  }
}

export function isCoordinatorRole(role: UserRole | MapAbleUserRole): boolean {
  return role === "support_coordinator" || role === "plan_manager";
}

export function resolveRoleView(role: UserRole | MapAbleUserRole) {
  if (isAdminRole(role)) return "admin" as const;
  if (isCoordinatorRole(role)) return "coordinator" as const;
  return "participant" as const;
}

export async function assertParticipantAccess(params: {
  actorId: string;
  actorRole: UserRole | MapAbleUserRole;
  participantId: string;
}): Promise<void> {
  const { actorId, actorRole, participantId } = params;

  if (actorId === participantId) return;
  if (isAdminRole(actorRole)) return;

  if (actorRole === "support_coordinator") {
    const allowed = await hasActiveConsentForCoordinator(
      participantId,
      actorId,
    );
    if (allowed) return;
  }

  if (actorRole === "family_member") {
    // Family members may view linked participant via dashboard patterns — deny by default here.
    throw new CoordinateAccessError("CONSENT_REQUIRED");
  }

  throw new CoordinateAccessError("FORBIDDEN");
}

export function resolveParticipantScope(params: {
  actorId: string;
  actorRole: UserRole | MapAbleUserRole;
  requestedParticipantId?: string | null;
}): string {
  const roleView = resolveRoleView(params.actorRole);
  if (roleView === "participant") {
    return params.actorId;
  }
  if (!params.requestedParticipantId) {
    throw new CoordinateAccessError("PARTICIPANT_ID_REQUIRED");
  }
  return params.requestedParticipantId;
}
