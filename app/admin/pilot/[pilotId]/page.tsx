import { PilotEnvironmentBanner } from "@/app/admin/pilot/_components/PilotEnvironmentBanner";
import { PilotSubnav } from "@/app/admin/pilot/_components/PilotSubnav";
import { loadAdminPilotPage } from "@/app/admin/pilot/_lib/load-pilot";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ pilotId: string }> };

export default async function AdminPilotOverviewPage({ params }: Props) {
  const { pilotId } = await params;
  const { pilot } = await loadAdminPilotPage(pilotId);

  const [enrolled, workers, openSignals] = await Promise.all([
    prisma.pilotParticipantEnrolment.count({
      where: { pilotId, status: "enrolled" },
    }),
    prisma.pilotWorkerAuthorisation.count({
      where: { pilotId, active: true },
    }),
    prisma.pilotSafetySignal.count({
      where: { pilotId, acknowledged: false },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">{pilot.name}</h1>
        <p className="text-sm">Code: {pilot.code}</p>
      </header>
      <PilotSubnav pilotId={pilotId} current="" />
      <PilotEnvironmentBanner
        stage={pilot.stage}
        limitedLiveEnabled={pilot.limitedLiveEnabled}
        status={pilot.status}
      />
      {pilot.summary ? <p>{pilot.summary}</p> : null}
      <section aria-labelledby="pilot-caps" className="space-y-2">
        <h2 id="pilot-caps" className="font-heading text-lg font-semibold">
          Caps and allowlists
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>
            Max transaction: {pilot.maxTransactionCents} cents · Daily:{" "}
            {pilot.maxDailyExposureCents} · Participant:{" "}
            {pilot.maxParticipantExposureCents} · Total:{" "}
            {pilot.maxTotalExposureCents}
          </li>
          <li>Max active participants: {pilot.maxActiveParticipants}</li>
          <li>
            Support item allowlist:{" "}
            {pilot.supportItemAllowlist.length === 0
              ? "empty (deny all)"
              : pilot.supportItemAllowlist.join(", ")}
          </li>
          <li>
            Funding route allowlist:{" "}
            {pilot.fundingRouteAllowlist.length === 0
              ? "empty (deny all)"
              : pilot.fundingRouteAllowlist.join(", ")}
          </li>
        </ul>
      </section>
      <section aria-labelledby="pilot-counts" className="space-y-2">
        <h2 id="pilot-counts" className="font-heading text-lg font-semibold">
          Current counts
        </h2>
        <p className="text-sm">
          Enrolled participants: {enrolled} · Active workers: {workers} · Open
          signals: {openSignals}
        </p>
      </section>
    </div>
  );
}
