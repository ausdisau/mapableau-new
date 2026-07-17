import type { Metadata } from "next";
import Link from "next/link";

import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { ReplayLabTimeline } from "@/components/replay-lab/ReplayLabTimeline";
import {
  loadHarbourStartingWorkScenario,
  replayLabFlags,
  runScenario,
} from "@/lib/replay-lab";
import { buildAccessibleReport } from "@/lib/replay-lab/report";

export const metadata: Metadata = {
  title: "Replay Lab (synthetic) | MapAble",
  description:
    "Safe rehearsal environment for synthetic disability-support journey simulations.",
};

export default function ReplayLabPage() {
  const enabled =
    replayLabFlags.enabled &&
    replayLabFlags.scenarioDsl &&
    replayLabFlags.virtualClock;

  if (!enabled) {
    return (
      <MapAbleCareMarketingShell>
        <main className="mx-auto max-w-3xl px-5 py-12">
          <h1 className="text-3xl font-black tracking-tight">MapAble Replay Lab</h1>
          <p className="mt-4 text-slate-600">
            Enable{" "}
            <code className="rounded bg-slate-100 px-1">MAPABLE_REPLAY_LAB_ENABLED</code>,{" "}
            <code className="rounded bg-slate-100 px-1">MAPABLE_REPLAY_SCENARIO_DSL_ENABLED</code>, and{" "}
            <code className="rounded bg-slate-100 px-1">MAPABLE_REPLAY_VIRTUAL_CLOCK_ENABLED</code>{" "}
            to view the synthetic Starting Work compound-failure rehearsal.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Replay Lab never uses production participant data and never writes operational domain
            tables.
          </p>
        </main>
      </MapAbleCareMarketingShell>
    );
  }

  const scenario = loadHarbourStartingWorkScenario();
  const result = runScenario({ scenario, seed: 42, runId: "ui_starting_work_42" });
  const report = buildAccessibleReport({
    title: scenario.scenario.title,
    seed: result.seed,
    scenarioId: result.scenarioId,
    runId: result.runId,
    events: result.events,
    actors: result.actors,
    scorecard: result.scorecard,
  });

  return (
    <MapAbleCareMarketingShell>
      <main className="mx-auto max-w-4xl space-y-8 px-5 py-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight">MapAble Replay Lab</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Mission Simulator — synthetic Harbour precinct with Taylor (
            <code className="rounded bg-slate-100 px-1">fixture:taylor</code>). Passing this
            rehearsal does not prove production safety.
          </p>
          <p className="mt-2 text-sm">
            <Link className="text-sky-800 underline" href="/access-intelligence/journey-preflight">
              Related: Access Intelligence journey preflight
            </Link>
          </p>
        </div>

        <ReplayLabTimeline report={report} />
      </main>
    </MapAbleCareMarketingShell>
  );
}
