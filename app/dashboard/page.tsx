import Link from "next/link";

import { MyDayAiAssistedPanel } from "@/components/dashboard/MyDayAiAssistedPanel";
import { MyDayProgrammaticPanel } from "@/components/dashboard/MyDayProgrammaticPanel";
import { DayChangesPanel } from "@/components/day/DayChangesPanel";
import { DayContinuityDemo } from "@/components/day/DayContinuityDemo";
import { DayHandoverDemo } from "@/components/day/DayHandoverDemo";
import { DayRoutinesDemo } from "@/components/day/DayRoutinesDemo";
import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import { adaptParticipantDashboard } from "@/lib/access/adaptive";
import { requireAuth } from "@/lib/auth/guards";
import { roleLabel } from "@/lib/auth/roles";
import { mapableDayFlags } from "@/lib/config/mapable-day";
import { participantWorkspaceFlags } from "@/lib/config/participant-workspace";
import { loadProgrammaticMyDay } from "@/lib/dashboard/load-my-day";

export const metadata = { title: "My Day | MapAble" };

export default async function DashboardPage() {
  const user = await requireAuth();
  const snapshot = await loadProgrammaticMyDay(user.id);
  const presentation = adaptParticipantDashboard({ profile: null });
  const careOsEnabled = getMapAbleIntelligenceConfig().enabled;
  const aiEnabled = participantWorkspaceFlags.aiAssistedViewEnabled();
  const dayV2 = mapableDayFlags.v2Enabled();
  const routinesDemo = mapableDayFlags.routinesDemoEnabled();
  const handoverDemo = mapableDayFlags.handoverDemoEnabled();
  const continuityDemo = mapableDayFlags.continuityDemoEnabled();

  const densityClass =
    presentation.applied &&
    presentation.policy?.informationDensity === "low"
      ? "max-w-3xl space-y-8"
      : "space-y-8";

  return (
    <div
      className={densityClass}
      data-adapt-runtime={presentation.applied ? "on" : "off"}
      data-adapt-variant={presentation.policy?.componentVariant ?? "default"}
      data-testid="participant-my-day-page"
      data-day-v2={dayV2 ? "on" : "off"}
    >
      <header className="space-y-2">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#005B7F]">
          Participant workspace
        </p>
        <h1 className="font-heading text-3xl font-bold text-[#0C1833]">
          My Day
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Signed in as <strong>{roleLabel(user.primaryRole)}</strong>. This
          page shows decision-safe context from your records. Administration
          stays in a separate permissioned workspace.
        </p>
      </header>

      <MyDayProgrammaticPanel snapshot={snapshot} />

      {dayV2 ? <DayChangesPanel snapshot={snapshot} /> : null}

      {routinesDemo ? <DayRoutinesDemo /> : null}
      {continuityDemo ? <DayContinuityDemo /> : null}
      {handoverDemo ? <DayHandoverDemo /> : null}

      <MyDayAiAssistedPanel
        enabled={aiEnabled}
        careOsEnabled={careOsEnabled}
        snapshot={snapshot}
      />

      <section
        aria-labelledby="more-tools-heading"
        className="rounded-2xl border border-slate-200 bg-white p-5"
      >
        <h2 id="more-tools-heading" className="text-lg font-bold">
          More tools
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Legacy deep links remain available. Use the left navigation for
          everyday paths.
        </p>
        <ul className="mt-4 flex flex-wrap gap-3 text-sm">
          <li>
            <Link className="font-bold text-[#005B7F] underline" href="/dashboard/billing">
              Billing centre
            </Link>
          </li>
          <li>
            <Link className="font-bold text-[#005B7F] underline" href="/dashboard/notifications">
              Notifications
            </Link>
          </li>
          <li>
            <Link className="font-bold text-[#005B7F] underline" href="/dashboard/jobs">
              Jobs
            </Link>
          </li>
          <li>
            <Link className="font-bold text-[#005B7F] underline" href="/dashboard/calendar">
              Calendar
            </Link>
          </li>
          {careOsEnabled ? (
            <li>
              <Link className="font-bold text-[#005B7F] underline" href="/dashboard/careos">
                My CareOS
              </Link>
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
