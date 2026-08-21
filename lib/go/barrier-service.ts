import type { AccessTemporaryBarrierType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { mapableGoFlags } from "@/lib/config/mapable-go";
import { prisma } from "@/lib/prisma";

const GRAPH_ID = "sandbox-sydney-cbd-pilot";
const DEFAULT_BARRIER_TTL_HOURS = 72;

export async function listActiveBarriers(graphId = GRAPH_ID) {
  const now = new Date();
  return prisma.accessTemporaryBarrier.findMany({
    where: {
      graphId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { reportedAt: "desc" },
    take: 100,
  });
}

export async function reportBarrier(params: {
  userId: string;
  segmentId: string;
  type: AccessTemporaryBarrierType;
  description?: string;
  lat?: number;
  lng?: number;
  ttlHours?: number;
}) {
  if (!mapableGoFlags.dynamicBarriersEnabled) {
    throw new Error("Dynamic barriers are not enabled");
  }

  const expiresAt = new Date(
    Date.now() + (params.ttlHours ?? DEFAULT_BARRIER_TTL_HOURS) * 60 * 60 * 1000,
  );

  const barrier = await prisma.accessTemporaryBarrier.create({
    data: {
      graphId: GRAPH_ID,
      segmentExternalId: params.segmentId,
      type: params.type,
      description: params.description,
      reporterUserId: params.userId,
      latitude: params.lat,
      longitude: params.lng,
      expiresAt,
      verificationState: "community_reported",
      source: "community",
      confidence: 0.5,
    },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "GO_BARRIER_REPORTED",
    entityType: "AccessTemporaryBarrier",
    entityId: barrier.id,
    participantId: params.userId,
    metadata: {
      segmentId: params.segmentId,
      type: params.type,
      graphId: GRAPH_ID,
    },
  });

  return barrier;
}
