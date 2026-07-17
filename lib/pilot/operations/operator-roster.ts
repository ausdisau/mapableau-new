import type { PilotOperatorRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function authorisePilotOperator(input: {
  pilotId: string;
  userId: string;
  role: PilotOperatorRole;
  authorisedById: string;
}) {
  return prisma.pilotAuthorisedOperator.upsert({
    where: {
      pilotId_userId_role: {
        pilotId: input.pilotId,
        userId: input.userId,
        role: input.role,
      },
    },
    create: {
      pilotId: input.pilotId,
      userId: input.userId,
      role: input.role,
      authorisedById: input.authorisedById,
      active: true,
    },
    update: {
      active: true,
      authorisedById: input.authorisedById,
      authorisedAt: new Date(),
      revokedAt: null,
    },
  });
}

export async function listActiveOperators(pilotId: string) {
  return prisma.pilotAuthorisedOperator.findMany({
    where: { pilotId, active: true },
    orderBy: { role: "asc" },
  });
}

export async function startOperatorShift(input: {
  pilotId: string;
  operatorId: string;
  notes?: string;
}) {
  return prisma.pilotOperatorShift.create({
    data: {
      pilotId: input.pilotId,
      operatorId: input.operatorId,
      notes: input.notes,
    },
  });
}
