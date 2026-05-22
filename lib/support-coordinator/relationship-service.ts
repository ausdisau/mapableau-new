import { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { hasActiveConsentForCoordinator } from "@/lib/support-coordinator/consent-gate";
import { prisma } from "@/lib/prisma";

export async function requestCoordinatorAccess(params: {
  participantId: string;
  coordinatorId: string;
  scopes: string[];
}) {
  return prisma.coordinatorAccessRequest.create({
    data: {
      participantId: params.participantId,
      coordinatorId: params.coordinatorId,
      scopesJson: params.scopes,
      status: "pending",
    },
  });
}

export async function approveCoordinatorAccess(
  requestId: string,
  participantId: string
) {
  const req = await prisma.coordinatorAccessRequest.findUnique({
    where: { id: requestId },
  });
  if (!req || req.participantId !== participantId) throw new Error("FORBIDDEN");

  await prisma.coordinatorAccessRequest.update({
    where: { id: requestId },
    data: { status: "approved" },
  });

  const rel = await prisma.supportCoordinatorRelationship.upsert({
    where: {
      participantId_coordinatorId: {
        participantId: req.participantId,
        coordinatorId: req.coordinatorId,
      },
    },
    create: {
      participantId: req.participantId,
      coordinatorId: req.coordinatorId,
      status: "active",
      scopesJson: req.scopesJson as Prisma.InputJsonValue,
    },
    update: {
      status: "active",
      scopesJson: req.scopesJson as Prisma.InputJsonValue,
    },
  });

  await createAuditEvent({
    actorUserId: participantId,
    action: "coordinator.access_approved",
    entityType: "SupportCoordinatorRelationship",
    entityId: rel.id,
    participantId,
  });

  return rel;
}

export async function getCoordinatorParticipantSummary(
  coordinatorId: string,
  participantId: string
) {
  const allowed = await hasActiveConsentForCoordinator(
    participantId,
    coordinatorId
  );
  if (!allowed) throw new Error("CONSENT_REQUIRED");

  const summary = await prisma.participantSupportPlanSummary.findUnique({
    where: { participantId },
  });

  const bookings = await prisma.booking.count({
    where: { participantId, status: { not: "draft" } },
  });

  return {
    participantId,
    planSummary: summary?.summaryJson ?? {},
    openBookings: bookings,
    note: "Authorised summary only — sensitive notes excluded.",
  };
}
