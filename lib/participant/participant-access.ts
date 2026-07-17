import type { MapAbleUserRole } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { canViewParticipantProfile } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

const DELEGATE_CONSENT_SCOPES = [
  "profile_read",
  "booking_read",
  "booking_manage",
  "support_coordination_access",
] as const;

export type ParticipantAccessResult = {
  participantId: string;
  viewAsDelegate: boolean;
};

export function isParticipantRole(role: MapAbleUserRole): boolean {
  return role === "participant";
}

export function isDelegateRole(role: MapAbleUserRole): boolean {
  return role === "family_member" || role === "support_coordinator";
}

async function hasActiveDelegateConsent(
  participantId: string,
  delegateUserId: string,
): Promise<boolean> {
  const consent = await prisma.consentRecord.findFirst({
    where: {
      subjectUserId: participantId,
      grantedToUserId: delegateUserId,
      status: "active",
      scope: { in: [...DELEGATE_CONSENT_SCOPES] },
    },
    select: { id: true },
  });
  return Boolean(consent);
}

/**
 * Resolves which participant dashboard the actor may view.
 * Returns null when access is denied.
 */
export async function resolveParticipantAccess(
  actor: CurrentUser,
  participantIdParam?: string | null,
): Promise<ParticipantAccessResult | null> {
  const requestedId = participantIdParam?.trim();

  if (requestedId) {
    if (!canViewParticipantProfile(actor.primaryRole, actor.id, requestedId)) {
      return null;
    }
    if (actor.id === requestedId) {
      return { participantId: requestedId, viewAsDelegate: false };
    }
    if (isDelegateRole(actor.primaryRole as MapAbleUserRole)) {
      const ok = await hasActiveDelegateConsent(requestedId, actor.id);
      if (!ok) return null;
      return { participantId: requestedId, viewAsDelegate: true };
    }
    if (actor.primaryRole === "mapable_admin") {
      return { participantId: requestedId, viewAsDelegate: true };
    }
    return null;
  }

  if (
    isParticipantRole(actor.primaryRole as MapAbleUserRole) ||
    actor.roles.includes("participant")
  ) {
    return { participantId: actor.id, viewAsDelegate: false };
  }

  return null;
}

export async function logParticipantDashboardAccess(
  actor: CurrentUser,
  participantId: string,
  viewAsDelegate: boolean,
  section?: string,
): Promise<void> {
  await prisma.auditEvent.create({
    data: {
      actorUserId: actor.id,
      actorRole: actor.primaryRole as MapAbleUserRole,
      action: "participant.dashboard.view",
      entityType: "participant_dashboard",
      participantId,
      metadata: {
        viewAsDelegate,
        section: section ?? "overview",
      },
    },
  });
}
