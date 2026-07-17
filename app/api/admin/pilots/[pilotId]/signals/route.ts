import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { loadPilotScoped } from "@/lib/pilot/api/access";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ pilotId: string }> };

/** GET /api/admin/pilots/[pilotId]/signals */
export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:operations:view");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const signals = await prisma.pilotSafetySignal.findMany({
    where: { pilotId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      signalType: true,
      severity: true,
      summary: true,
      sourceRef: true,
      acknowledged: true,
      acknowledgedAt: true,
      createdAt: true,
      triggerId: true,
    },
  });

  return jsonNdisOk({
    pilotId,
    signals: signals.map((s) => ({
      ...s,
      acknowledgedAt: s.acknowledgedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
    })),
  });
}
