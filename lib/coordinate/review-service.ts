import type {
  CoordinateReviewTaskStatus,
  CoordinateReviewTaskType,
  MapAbleUserRole,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { assertParticipantAccess } from "./access-service";
import { logCoordinateAudit } from "./audit-service";
import { COORDINATE_AUDIT_ACTIONS } from "./types";

export async function createHumanReviewTask(params: {
  participantId: string;
  assigneeId?: string;
  taskType: CoordinateReviewTaskType;
  summary: string;
  payloadJson?: Record<string, unknown>;
  sourceEntityType?: string;
  sourceEntityId?: string;
  confidence?: number;
  reason?: string;
  priority?: number;
}) {
  return prisma.coordinateHumanReviewTask.create({
    data: {
      participantId: params.participantId,
      assigneeId: params.assigneeId,
      taskType: params.taskType,
      summary: params.summary,
      payloadJson: (params.payloadJson ?? {}) as Prisma.InputJsonValue,
      sourceEntityType: params.sourceEntityType,
      sourceEntityId: params.sourceEntityId,
      confidence: params.confidence,
      reason: params.reason,
      priority: params.priority ?? 0,
      status: "open",
    },
  });
}

export async function listHumanReviewTasks(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  participantId?: string;
  status?: CoordinateReviewTaskStatus[];
}) {
  if (params.participantId) {
    await assertParticipantAccess({
      actorId: params.actorId,
      actorRole: params.actorRole,
      participantId: params.participantId,
    });
  }

  return prisma.coordinateHumanReviewTask.findMany({
    where: {
      ...(params.participantId ? { participantId: params.participantId } : {}),
      ...(params.status ? { status: { in: params.status } } : {}),
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 50,
    include: {
      participant: {
        select: {
          name: true,
          participantProfile: { select: { displayName: true, preferredName: true } },
        },
      },
      assignee: { select: { name: true } },
    },
  });
}

export async function updateHumanReviewTask(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  taskId: string;
  participantId: string;
  status: CoordinateReviewTaskStatus;
  assigneeId?: string;
}) {
  await assertParticipantAccess(params);

  const task = await prisma.coordinateHumanReviewTask.findUnique({
    where: { id: params.taskId },
  });
  if (!task || task.participantId !== params.participantId) {
    throw new Error("NOT_FOUND");
  }

  const updated = await prisma.coordinateHumanReviewTask.update({
    where: { id: params.taskId },
    data: {
      status: params.status,
      assigneeId: params.assigneeId ?? task.assigneeId,
    },
  });

  await logCoordinateAudit({
    action:
      params.status === "approved"
        ? COORDINATE_AUDIT_ACTIONS.REVIEW_APPROVED
        : COORDINATE_AUDIT_ACTIONS.REVIEW_REJECTED,
    actorUserId: params.actorId,
    actorRole: params.actorRole,
    entityType: "CoordinateHumanReviewTask",
    entityId: updated.id,
    participantId: params.participantId,
    metadata: { status: params.status },
  });

  return updated;
}

export async function listActiveRiskFlags(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  participantId: string;
}) {
  await assertParticipantAccess(params);
  return prisma.coordinateRiskFlag.findMany({
    where: { participantId: params.participantId, active: true },
    orderBy: { createdAt: "desc" },
  });
}
