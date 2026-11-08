"use client";

import Link from "next/link";
import { useId, useState } from "react";

import type { MyDaySnapshot } from "@/lib/dashboard/my-day-status";

/**
 * Optional AI-assisted view — UI only when flags allow.
 * Never autonomously books, messages, or changes consent.
 */
export function MyDayAiAssistedPanel({
  enabled,
  careOsEnabled,
  snapshot,
}: {
  enabled: boolean;
  careOsEnabled: boolean;
  snapshot: MyDaySnapshot;
}) {
  const headingId = useId();
  const [pressed, setPressed] = useState(false);

  if (!enabled) {
    return (
      <section
        aria-labelledby={headingId}
        className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
        data-testid="my-day-ai-disabled"
      >
        <h2 id={headingId} className="text-lg font-bold text-[#0C1833]">
          AI-assisted view
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          This optional view is off. Programmatic My Day continues to work.
          AI assistance requires separate feature flags, consent, and human
          approval before any suggestion can become an action.
        </p>
        <p className="mt-2 text-sm">
          <Link href="/dashboard/safety" className="font-bold text-[#005B7F] underline">
            Help &amp; safety remains available
          </Link>
        </p>
      </section>
    );
  }

  if (!careOsEnabled) {
    return (
      <section
        aria-labelledby={headingId}
        className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5"
        data-testid="my-day-ai-careos-off"
      >
        <h2 id={headingId} className="text-lg font-bold text-[#0C1833]">
          AI-assisted view unavailable
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          CareOS is not enabled in this environment, so AI assistance cannot
          run. Continue with the programmatic view below.
        </p>
        <p className="mt-2 text-sm">
          <Link href="/dashboard/consent" className="font-bold text-[#005B7F] underline">
            Manage consent
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl border border-[#d9ccee] bg-[#fbf9ff] p-5"
      data-testid="my-day-ai-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-lg font-bold text-[#0C1833]">
          AI-assisted view (read-only)
        </h2>
        <button
          type="button"
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-[#005B7F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
          aria-pressed={pressed}
          onClick={() => setPressed((value) => !value)}
        >
          {pressed ? "Hide explanation" : "Show explanation"}
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-700">
        Suggestions are drafts only. MapAble will not create bookings, withdraw
        consent, choose workers, share records, trigger safety outcomes, or send
        messages from this panel.
      </p>
      <ul className="mt-4 space-y-3 text-sm">
        <li className="rounded-xl border border-[#e2d9f2] bg-white p-3">
          <strong>Draft summary</strong>
          <p className="mt-1 text-slate-700">
            {snapshot.empty
              ? "No authorised care or transport records were found for the next week."
              : `Programmatic sources show ${snapshot.pendingActions.length} pending item(s) and ${
                  snapshot.nearestConfirmed ? "one nearest confirmed activity" : "no nearest confirmed activity"
                }.`}
          </p>
          <dl className="mt-3 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
            <div>
              <dt className="font-bold">Sources</dt>
              <dd>Care bookings + transport trips (server-scoped)</dd>
            </div>
            <div>
              <dt className="font-bold">Freshness</dt>
              <dd>{snapshot.generatedAt}</dd>
            </div>
            <div>
              <dt className="font-bold">Uncertainty</dt>
              <dd>
                Pending or unknown statuses are never treated as confirmed.
              </dd>
            </div>
            <div>
              <dt className="font-bold">Action taken</dt>
              <dd>None — read-only suggestion</dd>
            </div>
          </dl>
        </li>
      </ul>
      {pressed ? (
        <p className="mt-3 rounded-xl bg-[#f3effa] p-3 text-sm text-[#40375c]">
          Explanation: this panel restates programmatic facts with clear
          uncertainty labels. It does not infer that transport depends on a care
          shift without a verified linkage, and it does not claim worker
          availability without evidence.
        </p>
      ) : null}
    </section>
  );
}
