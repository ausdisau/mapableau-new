import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { loadPilotScoped } from "@/lib/pilot/api/access";
import { reconcileDailyExposure } from "@/lib/pilot/finance/daily-reconciliation";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ pilotId: string }> };

/** GET /api/admin/pilots/[pilotId]/reconciliation */
export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:financial:view");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const ledger = await prisma.pilotExposureLedger.findMany({
    where: { pilotId, occurredAt: { gte: since } },
    orderBy: { occurredAt: "desc" },
    take: 500,
    select: {
      id: true,
      entryType: true,
      amountCents: true,
      balanceAfterCents: true,
      occurredAt: true,
    },
  });

  const result = reconcileDailyExposure({
    ledgerLines: ledger.map((l) => ({
      source: l.entryType,
      amountCents: l.amountCents,
    })),
    // No external NDIA remittance in Wave 7 — external total is zero until linked.
    externalLines: [],
  });

  return jsonNdisOk({
    pilotId,
    window: { since: since.toISOString() },
    reconciliation: result,
    ledger: ledger.map((l) => ({
      ...l,
      occurredAt: l.occurredAt.toISOString(),
    })),
    notice:
      "No real NDIA submission. External remittance lines are empty until a non-production integration is linked.",
  });
}
