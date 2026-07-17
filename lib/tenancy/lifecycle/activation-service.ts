import { prisma } from "@/lib/prisma";

import { assertTransitionAllowed } from "./status-transitions";

/**
 * Move a tenant from active_limited to active. Requires:
 *  - an approved GeneralAvailabilityAssessment
 *  - a human executive decision
 *  - explicit actor identity (not AI, not automation)
 *
 * This function does NOT itself decide GA — see production-readiness/ga-assessment.
 */
export async function activateTenant(input: {
  organisationId: string;
  actorUserId: string;
  reason: string;
  gaAssessmentId: string;
}) {
  if (!input.reason || input.reason.trim().length < 20) {
    throw new Error("ACTIVATION_REASON_TOO_SHORT");
  }
  const [org, ga] = await Promise.all([
    prisma.organisation.findUnique({
      where: { id: input.organisationId },
      select: { id: true, tenantStatus: true },
    }),
    prisma.generalAvailabilityAssessment.findUnique({
      where: { id: input.gaAssessmentId },
    }),
  ]);
  if (!org) throw new Error("ORGANISATION_NOT_FOUND");
  if (!ga || ga.organisationId !== input.organisationId) {
    throw new Error("GA_ASSESSMENT_NOT_FOUND_OR_MISMATCH");
  }
  if (ga.decision !== "approved" || !ga.executiveUserId) {
    throw new Error("GA_NOT_APPROVED_BY_EXECUTIVE");
  }
  assertTransitionAllowed(org.tenantStatus, "active");

  return prisma.$transaction(async (tx) => {
    await tx.tenantStatusTransition.create({
      data: {
        organisationId: input.organisationId,
        fromStatus: org.tenantStatus,
        toStatus: "active",
        reason: input.reason,
        actorUserId: input.actorUserId,
        metadata: { gaAssessmentId: input.gaAssessmentId },
      },
    });
    return tx.organisation.update({
      where: { id: input.organisationId },
      data: { tenantStatus: "active", activatedAt: new Date() },
    });
  });
}
