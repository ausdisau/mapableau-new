import type { Metadata } from "next";

import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { kuRingGaiPilotGuide } from "@/lib/access/guides/ku-ring-gai-pilot";

export const metadata: Metadata = {
  title: "Ku-ring-gai Local Access Guide | MapAble",
  description:
    "Pilot MapAble Local Access Guide for Ku-ring-gai, showing evidence-backed public accessibility information and explicit audit gaps.",
};

const evidenceLabel: Record<string, string> = {
  verified: "Verified",
  observed: "Observed",
  venue_reported: "Reported by venue/operator",
  community_reported: "Community reported",
  unknown: "Unknown / audit required",
  outdated: "Stale / re-verification required",
  disputed: "Disputed",
};

export default function KuRingGaiLocalAccessGuidePage() {
  const guide = kuRingGaiPilotGuide;

  return (
    <MapAbleCareMarketingShell>
      <main className="mx-auto max-w-5xl space-y-10 px-5 py-12">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
            Pilot evidence projection - not complete council coverage
          </p>
          <h1 className="text-4xl font-black tracking-tight">{guide.title}</h1>
          <p className="max-w-3xl text-lg text-slate-700">{guide.description}</p>
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <strong>Evidence notice:</strong> {guide.evidenceNotice}
          </div>
        </header>

        <section aria-labelledby="summary-heading" className="space-y-4">
          <h2 id="summary-heading" className="text-2xl font-bold">
            Pilot snapshot
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {guide.metrics.map((metric) => (
              <article key={metric.id} className="rounded-xl border border-slate-200 p-4">
                <p className="text-3xl font-black">{metric.value}</p>
                <p className="mt-1 text-sm text-slate-600">{metric.label}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="coverage-heading" className="space-y-4">
          <h2 id="coverage-heading" className="text-2xl font-bold">
            Localities represented
          </h2>
          <ul className="flex flex-wrap gap-2">
            {guide.localities.map((locality) => (
              <li key={locality} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800">
                {locality}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="assets-heading" className="space-y-4">
          <div>
            <h2 id="assets-heading" className="text-2xl font-bold">
              Accessibility evidence and audit gaps
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              This list is the primary accessible presentation. A map may enhance discovery later, but no
              essential evidence depends on map interaction.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {guide.assets.map((asset) => (
              <article key={asset.id} className="rounded-xl border border-slate-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">{asset.name}</h3>
                    <p className="text-sm text-slate-600">{asset.locality}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                    {evidenceLabel[asset.evidenceState] ?? asset.evidenceState}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-700">{asset.summary}</p>
                <dl className="mt-4 grid gap-2 text-sm">
                  <div>
                    <dt className="font-semibold">Asset type</dt>
                    <dd className="text-slate-600">{asset.kind.replaceAll("_", " ")}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Source</dt>
                    <dd className="text-slate-600">{asset.sourceLabel}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Audit required</dt>
                    <dd className="text-slate-600">{asset.auditRequired ? "Yes" : "No"}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="next-heading" className="rounded-xl border border-sky-200 bg-sky-50 p-5">
          <h2 id="next-heading" className="text-xl font-bold text-sky-950">
            Next verification layer
          </h2>
          <p className="mt-2 text-sm leading-6 text-sky-950">
            The pilot deliberately leaves priority footpaths, pedestrian crossings and kerb ramps as
            unknown until structured observations are imported or field verified. Unknown evidence must
            never be converted into an accessibility claim by inference alone.
          </p>
        </section>
      </main>
    </MapAbleCareMarketingShell>
  );
}
