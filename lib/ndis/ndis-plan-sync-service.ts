import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { callAdapter } from "@/lib/ndis/ndis-integration-service";
import { getNdisAdapter } from "@/lib/ndis/ndis-client";
import { requireNdisConsent } from "@/lib/ndis/ndis-consent-service";
import { getActiveAdapterType } from "@/lib/ndis/ndis-integration-service";
import { prisma } from "@/lib/prisma";

export async function syncPlanSnapshot(params: {
  participantId: string;
  actorUserId: string;
  source?: string;
}) {
  await requireNdisConsent(
    params.participantId,
    params.actorUserId,
    "plan_dates"
  );

  const adapterType = await getActiveAdapterType();
  const adapter = getNdisAdapter(adapterType);

  const plan = await callAdapter("getParticipantPlanSummary", () =>
    adapter.getParticipantPlanSummary(params.participantId)
  );

  const snapshot = await prisma.ndisPlanSnapshot.create({
    data: {
      participantId: params.participantId,
      source: params.source ?? adapterType,
      planStartDate: plan.planStartDate
        ? new Date(plan.planStartDate)
        : undefined,
      planEndDate: plan.planEndDate ? new Date(plan.planEndDate) : undefined,
      goalsJson: (plan.goals ?? []) as Prisma.InputJsonValue,
      budgetsJson: (plan.budgets ?? []) as Prisma.InputJsonValue,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "ndis.plan_snapshot_synced",
    entityType: "NdisPlanSnapshot",
    entityId: snapshot.id,
    participantId: params.participantId,
  });

  return snapshot;
}

export async function markPlanReviewed(snapshotId: string, userId: string) {
  const snapshot = await prisma.ndisPlanSnapshot.update({
    where: { id: snapshotId },
    data: { reviewedByUserAt: new Date() },
  });
  await createAuditEvent({
    actorUserId: userId,
    action: "ndis.plan_snapshot_reviewed",
    entityType: "NdisPlanSnapshot",
    entityId: snapshotId,
  });
  return snapshot;
}
