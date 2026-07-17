import type { Metadata } from "next";
import Link from "next/link";

import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import {
  accessCastFlags,
  compileAccessCastOfflinePack,
  evaluateOfflineAccessCast,
  forecastStartingWorkJourney,
  offlinePresentationCopy,
} from "@/lib/accesscast";

export const metadata: Metadata = {
  title: "Offline AccessCast | MapAble Access Weather",
  description:
    "Synthetic offline AccessCast Visit Pack projection — never silently current.",
};

export default function AccessCastOfflinePage() {
  const enabled = accessCastFlags.enabled && accessCastFlags.allowSyntheticExecution;

  if (!enabled) {
    return (
      <MapAbleCareMarketingShell>
        <main className="mx-auto max-w-3xl px-5 py-12">
          <h1 className="text-3xl font-black tracking-tight">Offline AccessCast</h1>
          <p className="mt-4 text-slate-600">
            Enable <code className="rounded bg-slate-100 px-1">MAPABLE_ACCESSCAST_ENABLED</code> to
            preview the offline Visit Pack projection contract.
          </p>
        </main>
      </MapAbleCareMarketingShell>
    );
  }

  const result = forecastStartingWorkJourney({ scenarioId: "starting_work_tomorrow" });
  const pack = compileAccessCastOfflinePack(result);
  const expiredEval = evaluateOfflineAccessCast(pack, "2099-01-01T00:00:00.000Z");
  const presentation = offlinePresentationCopy(expiredEval);

  return (
    <MapAbleCareMarketingShell>
      <main className="mx-auto max-w-3xl space-y-8 px-5 py-12">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
            Offline snapshot contract — synthetic
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">{presentation.title}</h1>
          <p className="mt-3 text-slate-600">{presentation.body}</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            Shown as current: {String(presentation.showAsCurrent)}
          </p>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Generated</dt>
            <dd>
              <time dateTime={pack.generatedAt}>{pack.generatedAt}</time>
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Expires</dt>
            <dd>
              <time dateTime={pack.expiresAt}>{pack.expiresAt}</time>
            </dd>
          </div>
          <div>
            <dt className="font-semibold">State at save</dt>
            <dd>{pack.stateAtSave}</dd>
          </div>
          <div>
            <dt className="font-semibold">Effective when expired</dt>
            <dd>{expiredEval.effectiveState}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold">Changed since saved</dt>
            <dd>{String(expiredEval.changedSinceSaved)}</dd>
          </div>
        </dl>

        <section aria-labelledby="sources-heading">
          <h2 id="sources-heading" className="text-lg font-bold">
            Sources not refreshed
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
            {pack.sourcesNotRefreshed.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="limits-heading">
          <h2 id="limits-heading" className="text-lg font-bold">
            Limitations
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {expiredEval.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>

        <p>
          <Link className="text-sky-800 underline" href="/accesscast/demo">
            Back to AccessCast demo
          </Link>
        </p>
      </main>
    </MapAbleCareMarketingShell>
  );
}
