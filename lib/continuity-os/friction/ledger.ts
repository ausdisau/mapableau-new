import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { ContinuityOsError } from "@/lib/continuity-os/errors";
import { isFrictionEnabled } from "@/lib/continuity-os/feature-flags";
import { prisma } from "@/lib/prisma";

/**
 * System-burden ledger. Never used to score or deny participants.
 */
export async function recordFrictionEvent(params: {
  participantId: string;
  actorUserId: string;
  missionId?: string;
  sourceService: string;
  organisationId?: string;
  workflow: string;
  cause: string;
  participantActionRequired?: boolean;
  timeBurdenMinutes?: number;
  travelBurdenKm?: number;
  disclosureBurden?: string;
  financialBurdenCents?: number;
  accessibilityBurden?: string;
  avoidable?: boolean;
  remediationOwner?: string;
  evidence?: Record<string, unknown>;
}) {
  if (!isFrictionEnabled()) {
    throw new ContinuityOsError("FRICTION_DISABLED", "Friction ledger disabled.", 503);
  }

  const event = await prisma.accessFrictionEvent.create({
    data: {
      missionId: params.missionId,
      participantId: params.participantId,
      sourceService: params.sourceService,
      organisationId: params.organisationId,
      workflow: params.workflow,
      cause: params.cause,
      participantActionRequired: params.participantActionRequired ?? false,
      timeBurdenMinutes: params.timeBurdenMinutes ?? 0,
      travelBurdenKm: params.travelBurdenKm ?? 0,
      disclosureBurden: params.disclosureBurden ?? "none",
      financialBurdenCents: params.financialBurdenCents ?? 0,
      accessibilityBurden: params.accessibilityBurden ?? "none",
      avoidable: params.avoidable ?? true,
      remediationOwner: params.remediationOwner,
      evidenceJson: params.evidence ?? {},
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "continuity.friction.recorded",
    entityType: "AccessFrictionEvent",
    entityId: event.id,
    participantId: params.participantId,
    metadata: {
      sourceService: params.sourceService,
      workflow: params.workflow,
      // Explicitly no participant score fields
    },
  });

  return event;
}

export async function summariseFriction(participantId: string) {
  if (!isFrictionEnabled()) {
    throw new ContinuityOsError("FRICTION_DISABLED", "Friction ledger disabled.", 503);
  }
  const events = await prisma.accessFrictionEvent.findMany({
    where: { participantId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const byService: Record<string, number> = {};
  let totalMinutes = 0;
  for (const event of events) {
    byService[event.sourceService] = (byService[event.sourceService] ?? 0) + 1;
    totalMinutes += event.timeBurdenMinutes;
  }

  return {
    eventCount: events.length,
    totalCoordinationMinutes: totalMinutes,
    byService,
    events,
    disclaimer:
      "Friction measures system and journey burden. It is not a participant score and must not be used to deny service.",
  };
}
