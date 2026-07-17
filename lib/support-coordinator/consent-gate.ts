import { prisma } from "@/lib/prisma";

/**
 * Wave 9 hardening: relationship != authority.
 *
 * A `SupportCoordinatorRelationship` being `active` is a *relationship*,
 * not consent to access participant data. For coordinator actions we require
 * BOTH:
 *
 *   1. an active relationship, AND
 *   2. a non-withdrawn `ConsentDirective` OR an active `ConsentRecord`
 *      granted to that specific coordinator user.
 *
 * `hasActiveConsentForCoordinator` is retained for legacy call sites but is
 * now a strict AND of relationship + explicit consent.
 */
export async function hasActiveConsentForCoordinator(
  participantId: string,
  coordinatorId: string
): Promise<boolean> {
  const rel = await prisma.supportCoordinatorRelationship.findUnique({
    where: {
      participantId_coordinatorId: { participantId, coordinatorId },
    },
  });
  if (rel?.status !== "active") return false;

  const now = new Date();

  const directive = await prisma.consentDirective.findFirst({
    where: {
      subjectId: participantId,
      recipientCategory: "support_coordinator",
      status: "active",
      decision: "active",
      OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });
  if (directive) return true;

  const record = await prisma.consentRecord.findFirst({
    where: {
      subjectUserId: participantId,
      grantedToUserId: coordinatorId,
      scope: "support_coordination_access",
      status: "active",
      OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
    },
  });
  return Boolean(record);
}

/**
 * Explicit helper used by new callers that want to communicate the
 * "relationship != authority" invariant in code. Returns a rich result rather
 * than a boolean.
 */
export interface CoordinatorAuthorityCheck {
  relationshipActive: boolean;
  consentPresent: boolean;
  consentSource: "directive" | "record" | null;
  hasAuthority: boolean;
  reason?: string;
}

export async function evaluateCoordinatorAuthority(
  participantId: string,
  coordinatorId: string
): Promise<CoordinatorAuthorityCheck> {
  const rel = await prisma.supportCoordinatorRelationship.findUnique({
    where: {
      participantId_coordinatorId: { participantId, coordinatorId },
    },
  });
  const relationshipActive = rel?.status === "active";
  const now = new Date();

  const directive = await prisma.consentDirective.findFirst({
    where: {
      subjectId: participantId,
      recipientCategory: "support_coordinator",
      status: "active",
      decision: "active",
      OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });

  let consentSource: "directive" | "record" | null = null;
  if (directive) {
    consentSource = "directive";
  } else {
    const record = await prisma.consentRecord.findFirst({
      where: {
        subjectUserId: participantId,
        grantedToUserId: coordinatorId,
        scope: "support_coordination_access",
        status: "active",
        OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
      },
    });
    if (record) consentSource = "record";
  }

  const consentPresent = consentSource !== null;
  const hasAuthority = relationshipActive && consentPresent;

  return {
    relationshipActive,
    consentPresent,
    consentSource,
    hasAuthority,
    reason: hasAuthority
      ? undefined
      : !relationshipActive
        ? "relationship_missing_or_inactive"
        : "consent_missing_relationship_is_not_authority",
  };
}
