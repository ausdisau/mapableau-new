import type { CoordinatorTaskType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createCoordinatorTaskForParticipant(params: {
  participantId: string;
  coordinatorId: string;
  taskType: CoordinatorTaskType;
  title: string;
}) {
  const rel = await prisma.supportCoordinatorRelationship.findUnique({
    where: {
      participantId_coordinatorId: {
        participantId: params.participantId,
        coordinatorId: params.coordinatorId,
      },
    },
  });
  if (!rel || rel.status !== "active") return null;

  return prisma.supportCoordinatorTask.create({
    data: {
      relationshipId: rel.id,
      taskType: params.taskType,
      title: params.title,
      status: "open",
    },
  });
}

export async function listCoordinatorTasks(coordinatorId: string, status?: string) {
  const rels = await prisma.supportCoordinatorRelationship.findMany({
    where: { coordinatorId, status: "active" },
    select: { id: true, participantId: true },
  });
  const relIds = rels.map((r) => r.id);
  if (relIds.length === 0) return [];

  return prisma.supportCoordinatorTask.findMany({
    where: {
      relationshipId: { in: relIds },
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      relationship: { select: { participantId: true, coordinatorId: true } },
    },
  });
}

export async function updateCoordinatorTask(
  taskId: string,
  coordinatorId: string,
  data: { status?: string; title?: string }
) {
  const task = await prisma.supportCoordinatorTask.findUnique({
    where: { id: taskId },
    include: { relationship: true },
  });
  if (!task || task.relationship.coordinatorId !== coordinatorId) {
    throw new Error("FORBIDDEN");
  }

  return prisma.supportCoordinatorTask.update({
    where: { id: taskId },
    data,
  });
}
