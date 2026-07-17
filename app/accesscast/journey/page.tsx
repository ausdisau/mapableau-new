import type { Metadata } from "next";
import Link from "next/link";

import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import {
  ACCESS_CAST_STATE_PLAIN_LANGUAGE,
  accessCastFlags,
  runStartingWorkJourneyAccessCast,
} from "@/lib/accesscast";

export const metadata: Metadata = {
  title: "Starting Work journey AccessCast (synthetic) | MapAble",
  description:
    "Taylor to Harbour Civic Centre Room 3.12 — synthetic Access Weather journey outlook.",
};

export default function AccessCastJourneyPage() {
  const enabled =
    accessCastFlags.enabled &&
    accessCastFlags.allowSyntheticExecution &&
    accessCastFlags.journeyOutlook;

  if (!enabled) {
    return (
      <MapAbleCareMarketingShell>
        <main className="mx-auto max-w-3xl px-5 py-12">
          <h1 className="text-3xl font-black tracking-tight">
            Starting Work journey outlook
          </h1>
          <p className="mt-4 text-slate-600">
            Enable{" "}
            <code className="rounded bg-slate-100 px-1">MAPABLE_ACCESSCAST_ENABLED</code>,{" "}
            <code className="rounded bg-slate-100 px-1">
              MAPABLE_ACCESSCAST_JOURNEY_OUTLOOK_ENABLED
            </code>
            , and mode <code className="rounded bg-slate-100 px-1">synthetic</code>.
          </p>
          <p className="mt-4">
            <Link className="text-sky-800 underline" href="/accesscast/demo">
              Access Weather demo
            </Link>
          </p>
        </main>
      </MapAbleCareMarketingShell>
    );
  }

  const journey = runStartingWorkJourneyAccessCast({
    scenario: "starting_work_tomorrow",
  });
  const { result } = journey;

  return (
    <MapAbleCareMarketingShell>
      <main className="mx-auto max-w-4xl space-y-10 px-5 py-12">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
            Synthetic Starting Work pilot — not a production claim
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Journey AccessCast
          </h1>
          <p className="mt-2 text-lg text-slate-700">
            {journey.participantLabel} → {journey.venueLabel}, {journey.destinationLabel}
          </p>
          <p className="mt-3 max-w-2xl text-slate-600">
            Full door-to-room outlook with return-leg fragility. The timeline list is
            authoritative. A map is not required.
          </p>
        </header>

        <article
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-5"
          aria-label="Access outlook card"
        >
          <h2 className="text-xl font-bold">Access outlook</h2>
          <p>
            <span className="font-semibold">State:</span>{" "}
            {result.envelope.conclusionState.replaceAll("_", " ")}
          </p>
          <p className="text-sm text-slate-600">
            {ACCESS_CAST_STATE_PLAIN_LANGUAGE[result.envelope.conclusionState]}
          </p>

          <section aria-labelledby="why-heading">
            <h3 id="why-heading" className="font-semibold">
              Why
            </h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
              {result.why.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="checks-heading">
            <h3 id="checks-heading" className="font-semibold">
              Suggested checks
            </h3>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
              {result.suggestedChecks.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="fragility-heading">
            <h3 id="fragility-heading" className="font-semibold">
              Fragility
            </h3>
            <p className="mt-1 text-sm">
              {journey.fragility.isFragile
                ? "This journey is fragile or cannot be confirmed."
                : "No fragility window identified in this fixture."}
            </p>
            {journey.fragility.singlePointsOfFailure.length > 0 ? (
              <ul className="mt-1 list-disc pl-5 text-sm">
                {journey.fragility.singlePointsOfFailure.map((id) => (
                  <li key={id}>Single point of failure: {id}</li>
                ))}
              </ul>
            ) : null}
          </section>

          <section aria-labelledby="return-heading">
            <h3 id="return-heading" className="font-semibold">
              Return journey
            </h3>
            {journey.returnJourney ? (
              <p className="mt-1 text-sm">
                {journey.returnJourney.label}:{" "}
                {journey.returnJourney.currentState.replaceAll("_", " ")} —{" "}
                {journey.returnJourney.evidenceSummary}
              </p>
            ) : (
              <p className="mt-1 text-sm">Return journey not evaluated.</p>
            )}
          </section>

          <section aria-labelledby="timeline-heading">
            <h3 id="timeline-heading" className="font-semibold">
              Forecast timeline
            </h3>
            <ol className="mt-2 space-y-2 text-sm">
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
          </section>

          <section aria-labelledby="steps-heading">
            <h3 id="steps-heading" className="font-semibold">
              Route steps
            </h3>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
              {result.segments.map((s) => (
                <li key={s.id}>
                  {s.label}: {s.currentState.replaceAll("_", " ")}
                  {s.confirmationTask ? ` — Check: ${s.confirmationTask.label}` : ""}
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="audio-heading">
            <h3 id="audio-heading" className="font-semibold">
              Audio summary (text)
            </h3>
            <p className="mt-1 text-sm text-slate-700">{journey.audioSummary}</p>
          </section>
        </article>

        <p className="text-sm text-slate-500">
          Mission {journey.missionId}. Print view available via API{" "}
          <code className="rounded bg-slate-100 px-1">printSummary</code>.
        </p>
      </main>
    </MapAbleCareMarketingShell>
  );
}
