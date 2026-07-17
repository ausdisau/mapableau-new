import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { loadPilotScoped } from "@/lib/pilot/api/access";
import { loadPilotCounters } from "@/lib/pilot/limits/pilot-counter-store";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ pilotId: string }> };

/** GET /api/admin/pilots/[pilotId]/limits */
export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:financial:view");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const [counters, openReservations] = await Promise.all([
    loadPilotCounters(pilotId, null),
    prisma.pilotLimitReservation.findMany({
      where: { pilotId, status: "reserved" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        amountCents: true,
        status: true,
        participantId: true,
        reservationType: true,
        reservedAt: true,
      },
    }),
  ]);

  return jsonNdisOk({
    pilotId,
    caps: {
      maxTransactionCents: pilot.maxTransactionCents,
      maxDailyExposureCents: pilot.maxDailyExposureCents,
      maxParticipantExposureCents: pilot.maxParticipantExposureCents,
      maxTotalExposureCents: pilot.maxTotalExposureCents,
    },
    counters,
    openReservations: openReservations.map((r) => ({
      ...r,
      reservedAt: r.reservedAt.toISOString(),
    })),
  });
}
