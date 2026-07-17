import { PilotEnvironmentBanner } from "@/app/admin/pilot/_components/PilotEnvironmentBanner";
import { PilotSubnav } from "@/app/admin/pilot/_components/PilotSubnav";
import { loadAdminPilotPage } from "@/app/admin/pilot/_lib/load-pilot";
import { reconcileDailyExposure } from "@/lib/pilot/finance/daily-reconciliation";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ pilotId: string }> };

export default async function AdminPilotReconciliationPage({ params }: Props) {
  const { pilotId } = await params;
  const { pilot } = await loadAdminPilotPage(pilotId);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const ledger = await prisma.pilotExposureLedger.findMany({
    where: { pilotId, occurredAt: { gte: since } },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });
  const result = reconcileDailyExposure({
    ledgerLines: ledger.map((l) => ({
      source: l.entryType,
      amountCents: l.amountCents,
    })),
    externalLines: [],
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        Reconciliation — {pilot.name}
      </h1>
      <PilotSubnav pilotId={pilotId} current="/reconciliation" />
      <PilotEnvironmentBanner
        stage={pilot.stage}
        limitedLiveEnabled={pilot.limitedLiveEnabled}
        status={pilot.status}
      />
      <p className="text-sm">
        Last 24 hours. External NDIA remittance is not linked — no real NDIA
        submission occurs from this surface.
      </p>
      <p className="text-sm">
        Balanced: {result.balanced ? "yes" : "no"} · Ledger total:{" "}
        {result.ledgerTotalCents} cents · External total:{" "}
        {result.externalTotalCents} cents · Delta: {result.deltaCents} cents
      </p>
      <p className="text-sm">Ledger entries shown: {ledger.length}</p>
    </div>
  );
}
