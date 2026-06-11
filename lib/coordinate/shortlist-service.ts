import type { MapAbleUserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { assertParticipantAccess } from "./access-service";
import { getCoordinateAIEngine } from "./ai/engine";
import { shouldEscalateToHumanReview } from "./ai/escalation";
import { logCoordinateAudit } from "./audit-service";
import { createHumanReviewTask } from "./review-service";
import { COORDINATE_AUDIT_ACTIONS } from "./types";

export async function generateProviderShortlist(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  planId: string;
  participantId: string;
  needDescription: string;
}) {
  await assertParticipantAccess(params);

  const plan = await prisma.coordinateNdisPlan.findUnique({
    where: { id: params.planId },
  });
  if (!plan || plan.participantId !== params.participantId) {
    throw new Error("NOT_FOUND");
  }

  const profile = await prisma.participantProfile.findUnique({
    where: { userId: params.participantId },
    select: { homeSuburb: true },
  });

  const providers = await prisma.ndisProvider.findMany({
    take: 40,
    orderBy: { providerName: "asc" },
  });

  const engine = getCoordinateAIEngine();
  const { items, meta } = engine.rankProviders({
    providers: providers.map((p) => ({
      sourceId: p.sourceId,
      providerName: p.providerName,
      suburb: p.suburb,
      state: p.state,
      services: p.services,
      registrationGroups: p.registrationGroups,
    })),
    needDescription: params.needDescription,
    participantSuburb: profile?.homeSuburb,
  });

  await prisma.coordinateProviderShortlistItem.deleteMany({
    where: { planId: params.planId },
  });

  const created = [];
  for (const [index, item] of items.entries()) {
    const conflictDetected = item.conflictFlags.length > 0;
    const escalation = shouldEscalateToHumanReview({
      confidence: item.confidence,
      conflictDetected,
      taskType: conflictDetected ? "conflict" : undefined,
    });

    const row = await prisma.coordinateProviderShortlistItem.create({
      data: {
        planId: params.planId,
        ndisProviderId: item.ndisProviderId,
        rank: index + 1,
        matchScore: item.matchScore,
        matchReason: item.matchReason,
        conflictFlagsJson: item.conflictFlags,
        status: escalation.escalate ? "suggested" : "suggested",
      },
    });
    created.push({ ...row, providerName: item.providerName, meta: item });

    if (escalation.escalate) {
      await createHumanReviewTask({
        participantId: params.participantId,
        taskType: escalation.taskType,
        summary: `Review provider match: ${item.providerName}`,
        payloadJson: { shortlistItemId: row.id, conflictFlags: item.conflictFlags },
        sourceEntityType: "CoordinateProviderShortlistItem",
        sourceEntityId: row.id,
        confidence: item.confidence,
        reason: escalation.reason,
      });
    }
  }

  await logCoordinateAudit({
    action: COORDINATE_AUDIT_ACTIONS.SHORTLIST_GENERATED,
    actorUserId: params.actorId,
    actorRole: params.actorRole,
    entityType: "CoordinateNdisPlan",
    entityId: params.planId,
    participantId: params.participantId,
    metadata: { count: created.length, confidence: meta.confidence },
  });

  return { items: created, meta };
}

export async function listShortlistItems(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  planId: string;
  participantId: string;
}) {
  await assertParticipantAccess(params);

  const plan = await prisma.coordinateNdisPlan.findUnique({
    where: { id: params.planId },
  });
  if (!plan || plan.participantId !== params.participantId) {
    throw new Error("NOT_FOUND");
  }

  return prisma.coordinateProviderShortlistItem.findMany({
    where: { planId: params.planId },
    orderBy: { rank: "asc" },
  });
}

export async function reviewShortlistItem(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  itemId: string;
  participantId: string;
  status: "approved" | "rejected";
}) {
  await assertParticipantAccess(params);

  const item = await prisma.coordinateProviderShortlistItem.findUnique({
    where: { id: params.itemId },
    include: { plan: true },
  });
  if (!item || item.plan.participantId !== params.participantId) {
    throw new Error("NOT_FOUND");
  }

  const updated = await prisma.coordinateProviderShortlistItem.update({
    where: { id: params.itemId },
    data: { status: params.status },
  });

  await logCoordinateAudit({
    action: COORDINATE_AUDIT_ACTIONS.SHORTLIST_ITEM_REVIEWED,
    actorUserId: params.actorId,
    actorRole: params.actorRole,
    entityType: "CoordinateProviderShortlistItem",
    entityId: updated.id,
    participantId: params.participantId,
    metadata: { status: params.status },
  });

  return updated;
}
