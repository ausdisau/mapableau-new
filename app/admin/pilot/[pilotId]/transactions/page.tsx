import { PilotEnvironmentBanner } from "@/app/admin/pilot/_components/PilotEnvironmentBanner";
import { PilotSubnav } from "@/app/admin/pilot/_components/PilotSubnav";
import { loadAdminPilotPage } from "@/app/admin/pilot/_lib/load-pilot";
import { loadPilotCounters } from "@/lib/pilot/limits/pilot-counter-store";

type Props = { params: Promise<{ pilotId: string }> };

export default async function AdminPilotTransactionsPage({ params }: Props) {
  const { pilotId } = await params;
  const { pilot } = await loadAdminPilotPage(pilotId);
  const counters = await loadPilotCounters(pilotId, null);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        Transactions — {pilot.name}
      </h1>
      <PilotSubnav pilotId={pilotId} current="/transactions" />
      <PilotEnvironmentBanner
        stage={pilot.stage}
        limitedLiveEnabled={pilot.limitedLiveEnabled}
        status={pilot.status}
      />
      <p className="text-sm">
        Placeholder view of cap usage. The execution gateway enforces limits;
        there is no Submit to NDIA control on this page.
      </p>
      <section aria-labelledby="caps" className="space-y-2">
        <h2 id="caps" className="font-heading text-lg font-semibold">
          Caps usage
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>
            Reserved: {counters.reservedCents} cents / total cap{" "}
            {pilot.maxTotalExposureCents}
          </li>
          <li>
            Committed: {counters.committedCents} cents · Daily committed:{" "}
            {counters.dailyCommittedCents} / {pilot.maxDailyExposureCents}
          </li>
          <li>
            Max single transaction: {pilot.maxTransactionCents} cents · Max
            participant exposure: {pilot.maxParticipantExposureCents}
          </li>
        </ul>
      </section>
    </div>
  );
}
