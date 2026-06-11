export { hasActiveConsentForCoordinator } from "@/lib/support-coordinator/consent-gate";

import { prisma } from "@/lib/prisma";

export async function getConsentGateState(params: {
  participantId: string;
  coordinatorId?: string;
}) {
  if (!params.coordinatorId) {
    return { active: true, message: "Participant self-service — no coordinator gate." };
  }

  const rel = await prisma.supportCoordinatorRelationship.findUnique({
    where: {
      participantId_coordinatorId: {
        participantId: params.participantId,
        coordinatorId: params.coordinatorId,
      },
    },
  });

  if (rel?.status === "active") {
    return { active: true, message: "Active consent for support coordination." };
  }

  return {
    active: false,
    message:
      "This participant has not authorised coordinator access. Request consent before viewing or changing plan details.",
  };
}
