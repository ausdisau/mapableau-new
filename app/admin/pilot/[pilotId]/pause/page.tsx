import { PilotEnvironmentBanner } from "@/app/admin/pilot/_components/PilotEnvironmentBanner";
import { PilotSubnav } from "@/app/admin/pilot/_components/PilotSubnav";
import { loadAdminPilotPage } from "@/app/admin/pilot/_lib/load-pilot";

type Props = { params: Promise<{ pilotId: string }> };

export default async function AdminPilotPausePage({ params }: Props) {
  const { pilotId } = await params;
  const { pilot } = await loadAdminPilotPage(pilotId);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        Pause and resume — {pilot.name}
      </h1>
      <PilotSubnav pilotId={pilotId} current="/pause" />
      <PilotEnvironmentBanner
        stage={pilot.stage}
        limitedLiveEnabled={pilot.limitedLiveEnabled}
        status={pilot.status}
      />
      <section className="space-y-2 text-sm">
        <p>
          Current pause reason:{" "}
          {pilot.pauseReason
            ? pilot.pauseReason.replace(/_/g, " ")
            : "not paused"}
        </p>
        <p>
          Paused at:{" "}
          {pilot.pausedAt ? pilot.pausedAt.toISOString() : "not set"}
        </p>
        <p>
          Resume requires human decision:{" "}
          {pilot.resumeRequiresDecision ? "yes" : "no"}
        </p>
        <p>
          Use the pause / resume API endpoints with a written rationale. AI must
          never auto-resume a paused pilot.
        </p>
      </section>
    </div>
  );
}
