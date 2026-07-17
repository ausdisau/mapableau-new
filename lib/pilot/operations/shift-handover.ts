import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function recordShiftHandover(input: {
  pilotId: string;
  fromShiftId?: string | null;
  toShiftId?: string | null;
  summary: string;
  openActions?: unknown[];
  createdById: string;
}) {
  return prisma.pilotHandoverRecord.create({
    data: {
      pilotId: input.pilotId,
      fromShiftId: input.fromShiftId ?? null,
      toShiftId: input.toShiftId ?? null,
      summary: input.summary,
      openActionsJson: (input.openActions ?? []) as Prisma.InputJsonValue,
      createdById: input.createdById,
    },
  });
}

export async function acknowledgeHandover(handoverId: string) {
  return prisma.pilotHandoverRecord.update({
    where: { id: handoverId },
    data: { acknowledgedAt: new Date() },
  });
}
