import { PilotEnvironmentBanner } from "@/app/admin/pilot/_components/PilotEnvironmentBanner";
import { PilotSubnav } from "@/app/admin/pilot/_components/PilotSubnav";
import { loadAdminPilotPage } from "@/app/admin/pilot/_lib/load-pilot";
import { hasOutstandingPilotExposure } from "@/lib/pilot/closure/outstanding-transaction-service";

type Props = { params: Promise<{ pilotId: string }> };

export default async function AdminPilotClosurePage({ params }: Props) {
  const { pilotId } = await params;
  const { pilot } = await loadAdminPilotPage(pilotId);
  const outstanding = await hasOutstandingPilotExposure(pilotId);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        Closure — {pilot.name}
      </h1>
      <PilotSubnav pilotId={pilotId} current="/closure" />
      <PilotEnvironmentBanner
        stage={pilot.stage}
        limitedLiveEnabled={pilot.limitedLiveEnabled}
        status={pilot.status}
      />
      <section className="space-y-2 text-sm">
        <p>
          Closed at: {pilot.closedAt ? pilot.closedAt.toISOString() : "not closed"}
        </p>
        <p>
          Terminated at:{" "}
          {pilot.terminatedAt ? pilot.terminatedAt.toISOString() : "not terminated"}
        </p>
        <p>
          Outstanding reservations blocking closure:{" "}
          {outstanding ? "yes — resolve or force with rationale" : "no"}
        </p>
        <p>
          Closure exits active participants and records a human close decision.
          Pilot approval remains distinct from production approval.
        </p>
      </section>
    </div>
  );
}
