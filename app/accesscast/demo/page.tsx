import type { Metadata } from "next";
import Link from "next/link";

import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import {
  ACCESS_CAST_STATE_PLAIN_LANGUAGE,
  accessCastFlags,
  runHarbourPlaceOutlook,
  runAccessCastForecast,
} from "@/lib/accesscast";

export const metadata: Metadata = {
  title: "Access Weather demo (synthetic) | MapAble AccessCast",
  description:
    "Synthetic Access Weather outlook for Harbour Civic Centre — not a production claim.",
};

export default function AccessCastDemoPage() {
  const enabled = accessCastFlags.enabled && accessCastFlags.allowSyntheticExecution;

  if (!enabled) {
    return (
      <MapAbleCareMarketingShell>
        <main className="mx-auto max-w-3xl px-5 py-12">
          <h1 className="text-3xl font-black tracking-tight">Access Weather</h1>
          <p className="mt-4 text-slate-600">
            Enable{" "}
            <code className="rounded bg-slate-100 px-1">MAPABLE_ACCESSCAST_ENABLED</code>{" "}
            (mode{" "}
            <code className="rounded bg-slate-100 px-1">synthetic</code>) to view the
            synthetic Harbour AccessCast demo.
          </p>
          <p className="mt-4">
            <Link className="text-sky-800 underline" href="/">
              Back to home
            </Link>
          </p>
        </main>
      </MapAbleCareMarketingShell>
    );
  }

  const place = runHarbourPlaceOutlook();
  const journey = runAccessCastForecast({
    journeyRef: "journey:synthetic:taylor-harbour:starting_work_tomorrow",
    intendedJourneyTime: "2026-07-17T08:30:00.000+10:00",
    asOf: "2026-07-16T18:00:00.000+10:00",
    scenario: "starting_work_tomorrow",
  });

  return (
    <MapAbleCareMarketingShell>
      <main className="mx-auto max-w-4xl space-y-10 px-5 py-12">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
            Synthetic fixture — not a production claim
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Access Weather</h1>
          <p className="mt-2 text-lg text-slate-700">Know before you go.</p>
          <p className="mt-3 max-w-2xl text-slate-600">
            AccessCast is a time-bounded accessibility outlook. It is not a safety
            guarantee, navigation authority, or universal accessibility score. A map is
            optional — the list below is authoritative.
          </p>
        </header>

        <section
          aria-labelledby="place-outlook-heading"
          className="space-y-4 border-t border-slate-200 pt-8"
        >
          <h2 id="place-outlook-heading" className="text-2xl font-bold">
            Place outlook — Harbour Civic Centre
          </h2>
          <AccessCastCard result={place} />
        </section>

        <section
          aria-labelledby="journey-outlook-heading"
          className="space-y-4 border-t border-slate-200 pt-8"
        >
          <h2 id="journey-outlook-heading" className="text-2xl font-bold">
            Journey outlook — Starting work tomorrow
          </h2>
          <AccessCastCard result={journey} showTimeline />
        </section>

        <section
          aria-labelledby="list-alt-heading"
          className="space-y-3 border-t border-slate-200 pt-8"
        >
          <h2 id="list-alt-heading" className="text-xl font-bold">
            Complete list alternative (no map required)
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            {journey.listAlternative.map((item) => (
              <li key={item.id}>
                <strong>{item.label}</strong> — {item.mapState}: {item.summary}
              </li>
            ))}
          </ul>
        </section>

        <p className="text-sm text-slate-500">
          Limitations: {journey.envelope.limitations.join(" · ")}
        </p>
      </main>
    </MapAbleCareMarketingShell>
  );
}

function AccessCastCard({
  result,
  showTimeline = false,
}: {
  result: ReturnType<typeof runHarbourPlaceOutlook>;
  showTimeline?: boolean;
}) {
  const { envelope } = result;
  return (
    <article
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-label="Access outlook card"
    >
      <div>
        <h3 className="text-lg font-bold">Access outlook</h3>
        <p className="mt-1 text-slate-700">
          <span className="font-semibold">Journey:</span> {envelope.journeyOrPlaceRef}
        </p>
        <p className="text-slate-700">
          <span className="font-semibold">Time:</span>{" "}
          {new Date(envelope.intendedJourneyTime).toLocaleString("en-AU", {
            timeZone: "Australia/Sydney",
          })}
        </p>
        <p className="mt-2 text-slate-900">
          <span className="font-semibold">State:</span>{" "}
          <span className="capitalize">{envelope.conclusionState.replaceAll("_", " ")}</span>
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {ACCESS_CAST_STATE_PLAIN_LANGUAGE[envelope.conclusionState]}
        </p>
      </div>

      <div>
        <h4 className="font-semibold">Why</h4>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {result.why.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="font-semibold">Suggested checks</h4>
        <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          {result.suggestedChecks.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
      </div>

      <div>
        <h4 className="font-semibold">Fallback</h4>
        <p className="mt-1 text-sm text-slate-700">
          {envelope.fallback?.summary ?? "No fallback recorded."}
        </p>
      </div>

      <div>
        <h4 className="font-semibold">Evidence confidence horizon</h4>
        <p className="mt-1 text-sm text-slate-700">
          Until{" "}
          {new Date(envelope.confidenceHorizon).toLocaleString("en-AU", {
            timeZone: "Australia/Sydney",
          })}
        </p>
      </div>

      {showTimeline && result.timeline.length > 0 ? (
        <div>
          <h4 className="font-semibold">Forecast timeline</h4>
          <ol className="mt-2 space-y-2 text-sm text-slate-700">
            {result.timeline.map((item) => (
              <li key={item.id}>
                <time dateTime={item.at}>
                  {new Date(item.at).toLocaleTimeString("en-AU", {
                    timeZone: "Australia/Sydney",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
                {" — "}
                {item.label}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div>
        <h4 className="font-semibold">Route steps</h4>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {result.segments.map((s) => (
            <li key={s.id}>
              {s.label}: {s.currentState.replaceAll("_", " ")} — {s.evidenceSummary}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-slate-500">
        Forecast {envelope.forecastId} · horizon {envelope.horizon} · evidence{" "}
        {envelope.sourceEvidence.length} · expires{" "}
        {new Date(envelope.expiry).toLocaleString("en-AU", {
          timeZone: "Australia/Sydney",
        })}
      </p>
    </article>
  );
}
