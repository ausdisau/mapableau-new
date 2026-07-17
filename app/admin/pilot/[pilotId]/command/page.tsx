import { PilotEnvironmentBanner } from "@/app/admin/pilot/_components/PilotEnvironmentBanner";
import { PilotSubnav } from "@/app/admin/pilot/_components/PilotSubnav";
import { loadAdminPilotPage } from "@/app/admin/pilot/_lib/load-pilot";
import { getPilotCommandCentre } from "@/lib/pilot/operations/command-centre-service";

type Props = { params: Promise<{ pilotId: string }> };

export default async function AdminPilotCommandPage({ params }: Props) {
  const { pilotId } = await params;
  const { pilot } = await loadAdminPilotPage(pilotId);
  const centre = await getPilotCommandCentre(pilotId);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        Command centre — {pilot.name}
      </h1>
      <PilotSubnav pilotId={pilotId} current="/command" />
      <PilotEnvironmentBanner
        stage={pilot.stage}
        limitedLiveEnabled={pilot.limitedLiveEnabled}
        status={pilot.status}
      />
      <section aria-labelledby="snapshot" className="space-y-2">
        <h2 id="snapshot" className="font-heading text-lg font-semibold">
          Operational snapshot
        </h2>
        <pre className="overflow-x-auto rounded border p-3 text-xs">
          {JSON.stringify(centre.snapshot, null, 2)}
        </pre>
      </section>
      <section aria-labelledby="queue" className="space-y-2">
        <h2 id="queue" className="font-heading text-lg font-semibold">
          Action queue
        </h2>
        <pre className="overflow-x-auto rounded border p-3 text-xs">
          {JSON.stringify(centre.queue, null, 2)}
        </pre>
      </section>
      <section aria-labelledby="operators" className="space-y-2">
        <h2 id="operators" className="font-heading text-lg font-semibold">
          Operators
        </h2>
        <p className="text-sm">
          Active operators: {centre.operators.length}
          {centre.latestHandover
            ? ` · Latest handover: ${centre.latestHandover.summary}`
            : " · No handover recorded"}
        </p>
      </section>
    </div>
  );
}
