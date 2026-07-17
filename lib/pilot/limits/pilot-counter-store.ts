import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type PilotCounters = {
  reservedCents: number;
  committedCents: number;
  dailyCommittedCents: number;
  participantReservedCents: number;
  participantCommittedCents: number;
};

function startOfUtcDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * DB-backed counters only — no in-memory authority.
 */
export async function loadPilotCounters(
  pilotId: string,
  participantId: string | null | undefined,
  db: Prisma.TransactionClient | typeof prisma = prisma
): Promise<PilotCounters> {
  const dayStart = startOfUtcDay();

  const [reservedAgg, committedAgg, dailyAgg, partReservedAgg, partCommittedAgg] =
    await Promise.all([
      db.pilotLimitReservation.aggregate({
        where: { pilotId, status: "reserved" },
        _sum: { amountCents: true },
      }),
      db.pilotLimitReservation.aggregate({
        where: { pilotId, status: "committed" },
        _sum: { amountCents: true },
      }),
      db.pilotLimitReservation.aggregate({
        where: {
          pilotId,
          status: "committed",
          committedAt: { gte: dayStart },
        },
        _sum: { amountCents: true },
      }),
      participantId
        ? db.pilotLimitReservation.aggregate({
            where: { pilotId, participantId, status: "reserved" },
            _sum: { amountCents: true },
          })
        : Promise.resolve({ _sum: { amountCents: 0 } }),
      participantId
        ? db.pilotLimitReservation.aggregate({
            where: { pilotId, participantId, status: "committed" },
            _sum: { amountCents: true },
          })
        : Promise.resolve({ _sum: { amountCents: 0 } }),
    ]);

  return {
    reservedCents: reservedAgg._sum.amountCents ?? 0,
    committedCents: committedAgg._sum.amountCents ?? 0,
    dailyCommittedCents: dailyAgg._sum.amountCents ?? 0,
    participantReservedCents: partReservedAgg._sum.amountCents ?? 0,
    participantCommittedCents: partCommittedAgg._sum.amountCents ?? 0,
  };
}
