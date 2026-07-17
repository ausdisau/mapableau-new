import type {
  PilotCorrectiveActionStatus,
  PilotCorrectiveActionType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createCorrectiveAction(input: {
  pilotId: string;
  actionType: PilotCorrectiveActionType;
  title: string;
  description?: string;
  ownerUserId?: string | null;
  dueAt?: Date | null;
  signalId?: string | null;
}) {
  return prisma.pilotCorrectiveAction.create({
    data: {
      pilotId: input.pilotId,
      actionType: input.actionType,
      title: input.title,
      description: input.description,
      ownerUserId: input.ownerUserId ?? null,
      dueAt: input.dueAt ?? null,
      signalId: input.signalId ?? null,
      status: "open",
    },
  });
}

export async function updateCorrectiveActionStatus(input: {
  id: string;
  status: PilotCorrectiveActionStatus;
}) {
  const data: {
    status: PilotCorrectiveActionStatus;
    completedAt?: Date;
    verifiedAt?: Date;
  } = { status: input.status };
  if (input.status === "completed") data.completedAt = new Date();
  if (input.status === "verified") data.verifiedAt = new Date();
  return prisma.pilotCorrectiveAction.update({
    where: { id: input.id },
    data,
  });
}
