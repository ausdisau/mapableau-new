import { PilotEnvironmentBanner } from "@/app/admin/pilot/_components/PilotEnvironmentBanner";
import { PilotSubnav } from "@/app/admin/pilot/_components/PilotSubnav";
import { loadAdminPilotPage } from "@/app/admin/pilot/_lib/load-pilot";
import { PILOT_STAGE_ORDER } from "@/lib/pilot/progression/stage-transition-policy";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ pilotId: string }> };

export default async function AdminPilotProgressionPage({ params }: Props) {
  const { pilotId } = await params;
  const { pilot } = await loadAdminPilotPage(pilotId);

  const decisions = await prisma.pilotDecisionRecord.findMany({
    where: { pilotId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        Progression — {pilot.name}
      </h1>
      <PilotSubnav pilotId={pilotId} current="/progression" />
      <PilotEnvironmentBanner
        stage={pilot.stage}
        limitedLiveEnabled={pilot.limitedLiveEnabled}
        status={pilot.status}
      />
      <section aria-labelledby="stages" className="space-y-2">
        <h2 id="stages" className="font-heading text-lg font-semibold">
          Stage ladder
        </h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {PILOT_STAGE_ORDER.map((stage) => (
            <li key={stage}>
              {stage.replace(/_/g, " ")}
              {stage === pilot.stage ? " — current" : ""}
            </li>
          ))}
        </ol>
        <p className="text-sm">
          Wave 6 assessment refs (optional strings): assurance={" "}
          {pilot.assuranceAssessmentId ?? "none"} · go-live={" "}
          {pilot.goLiveAssessmentId ?? "none"}
        </p>
      </section>
      <section aria-labelledby="decisions" className="space-y-2">
        <h2 id="decisions" className="font-heading text-lg font-semibold">
          Recent human decisions
        </h2>
        {decisions.length === 0 ? (
          <p className="text-sm">No decisions yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {decisions.map((d) => (
              <li key={d.id} className="rounded border p-3">
                {d.decision.replace(/_/g, " ")} — {d.fromStatus ?? "?"} →{" "}
                {d.toStatus ?? "?"} · {d.rationale.slice(0, 160)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
