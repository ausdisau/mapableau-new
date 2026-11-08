import { buildMyDaySnapshot } from "@/lib/dashboard/my-day-status";
import { prisma } from "@/lib/prisma";

/**
 * Server-only My Day loader. Always scopes by authenticated user id —
 * never accepts client-supplied participantId.
 */
export async function loadProgrammaticMyDay(participantUserId: string) {
  const now = new Date();
  const horizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const recent = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const [care, transport] = await Promise.all([
    prisma.careBooking.findMany({
      where: {
        participantId: participantUserId,
        OR: [
          { scheduledStartAt: { gte: now, lte: horizon } },
          {
            scheduledStartAt: null,
            status: { in: ["pending_provider", "accepted", "worker_assigned"] },
          },
          {
            status: "cancelled",
            updatedAt: { gte: recent },
          },
        ],
      },
      orderBy: { scheduledStartAt: "asc" },
      take: 20,
      select: {
        id: true,
        status: true,
        scheduledStartAt: true,
        careRequest: { select: { title: true } },
      },
    }),
    prisma.transportTrip.findMany({
      where: {
        participantId: participantUserId,
        OR: [
          { scheduledStart: { gte: now, lte: horizon } },
          {
            status: {
              in: ["requested", "provider_review", "accepted"],
            },
          },
          {
            status: { in: ["cancelled", "declined"] },
            updatedAt: { gte: recent },
          },
        ],
      },
      orderBy: { scheduledStart: "asc" },
      take: 20,
      select: {
        id: true,
        status: true,
        scheduledStart: true,
      },
    }),
  ]);

  return buildMyDaySnapshot({
    now,
    care: care.map((row) => ({
      id: row.id,
      status: row.status,
      title: row.careRequest.title,
      scheduledStartAt: row.scheduledStartAt,
    })),
    transport,
  });
}
