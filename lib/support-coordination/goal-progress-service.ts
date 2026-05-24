import {
  checkCoordinatorParticipantAccess,
} from "@/lib/access/consent-aware-access";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/mapable";

export async function listGoalProgress(params: {
  participantId: string;
  coordinatorId: string;
  actorRole: UserRole;
}) {
  const access = await checkCoordinatorParticipantAccess({
    coordinatorId: params.coordinatorId,
    participantId: params.participantId,
    actorRole: params.actorRole,
  });
  if (!access.allowed) throw new Error("CONSENT_REQUIRED");

  return prisma.goalProgressUpdate.findMany({
    where: { participantId: params.participantId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function upsertGoalProgress(params: {
  participantId: string;
  coordinatorId: string;
  goalTitle: string;
  progressPct: number;
  notes?: string;
  status?: string;
}) {
  const existing = await prisma.goalProgressUpdate.findFirst({
    where: {
      participantId: params.participantId,
      goalTitle: params.goalTitle,
    },
  });

  if (existing) {
    return prisma.goalProgressUpdate.update({
      where: { id: existing.id },
      data: {
        progressPct: params.progressPct,
        notes: params.notes,
        status: params.status ?? existing.status,
        coordinatorId: params.coordinatorId,
      },
    });
  }

  return prisma.goalProgressUpdate.create({
    data: {
      participantId: params.participantId,
      coordinatorId: params.coordinatorId,
      goalTitle: params.goalTitle,
      progressPct: params.progressPct,
      notes: params.notes,
      status: params.status ?? "in_progress",
    },
  });
}
