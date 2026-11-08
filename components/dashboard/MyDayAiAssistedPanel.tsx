"use client";

import Link from "next/link";
import { useId } from "react";

import type {
  MyDayAttention,
  MyDaySnapshot,
} from "@/lib/dashboard/my-day-status";

/**
 * Optional AI-assisted view — UI only when flags allow.
 * Never autonomously books, messages, or changes consent.
 */
export function MyDayAiAssistedPanel({
  enabled,
  careOsEnabled,
  snapshot,
  attention,
  onTurnOff,
}: {
  enabled: boolean;
  careOsEnabled: boolean;
  snapshot: MyDaySnapshot;
  attention?: MyDayAttention;
  onTurnOff?: () => void;
}) {
  const headingId = useId();

  if (!enabled) {
    return (
      <section
        aria-labelledby={headingId}
        className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
        data-testid="my-day-ai-disabled"
      >
        <h2 id={headingId} className="text-lg font-bold text-[#0C1833]">
          AI-assisted view is off
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          This optional view is off. Programmatic My Day continues to work. AI
          assistance requires separate feature flags, consent, and human
          approval before any suggestion can become an action.
        </p>
        <p className="mt-2 text-sm">
          <Link
            href="/dashboard/safety"
            className="font-bold text-[#005B7F] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
          >
            Help &amp; safety remains available
          </Link>
        </p>
        {onTurnOff ? (
          <div className="mt-4">
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-extrabold text-[#084865] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
              onClick={onTurnOff}
            >
              Turn off AI view
            </button>
          </div>
        ) : null}
      </section>
    );
  }

  if (!careOsEnabled) {
    return (
      <section
        aria-labelledby={headingId}
        className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm"
        data-testid="my-day-ai-careos-off"
      >
        <h2 id={headingId} className="text-lg font-bold text-[#0C1833]">
          AI-assisted view unavailable
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          CareOS is not enabled in this environment, so AI assistance cannot
          run. Continue with the programmatic view.
        </p>
        <p className="mt-2 text-sm">
          <Link
            href="/dashboard/consent"
            className="font-bold text-[#005B7F] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
          >
            Manage consent
          </Link>
        </p>
        {onTurnOff ? (
          <div className="mt-4">
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-extrabold text-[#084865] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
              onClick={onTurnOff}
            >
              Turn off AI view
            </button>
          </div>
        ) : null}
      </section>
    );
  }

  const draft =
    attention?.description ??
    (snapshot.empty
      ? "No authorised care or transport records were found for the next week."
      : `Programmatic sources show ${snapshot.pendingActions.length} pending item(s) and ${
          snapshot.nearestConfirmed
            ? "one nearest confirmed activity"
            : "no nearest confirmed activity"
        }.`);

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl border border-[#e2d9f2] bg-[#fbf9ff] p-5 shadow-sm"
      data-testid="my-day-ai-panel"
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#4c62cb] to-[#a75cd9] text-sm font-extrabold text-white"
          aria-hidden="true"
        >
          AI
        </span>
        <div>
          <h2 id={headingId} className="text-lg font-bold text-[#0C1833]">
            Optional AI guidance
          </h2>
          <p className="text-sm text-slate-600">Read-only draft only</p>
        </div>
      </div>
      <p className="text-sm text-slate-700">{draft}</p>
      <div className="mt-4 rounded-xl bg-[#f3effa] p-3 text-sm text-[#584d73]">
        <strong className="text-[#40375c]">Why this appeared</strong>
        <p className="mt-1">
          Based only on authorised programmatic care and transport records. This
          does not use diagnosis or private health information, and it does not
          assume transport depends on a care shift without a verified linkage.
        </p>
      </div>
      <dl className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="font-bold">Sources</dt>
          <dd>Care bookings + transport trips (server-scoped)</dd>
        </div>
        <div>
          <dt className="font-bold">Freshness</dt>
          <dd>
            {new Date(snapshot.generatedAt).toLocaleString("en-AU", {
              timeZone: "Australia/Sydney",
            })}{" "}
            (Australia/Sydney)
          </dd>
        </div>
        <div>
          <dt className="font-bold">Uncertainty</dt>
          <dd>Pending or unknown statuses are never treated as confirmed.</dd>
        </div>
        <div>
          <dt className="font-bold">Action taken</dt>
          <dd>None — read-only suggestion</dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-wrap gap-3">
        {attention ? (
          <Link
            href={attention.primaryHref}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-extrabold text-[#084865] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
          >
            Review options
          </Link>
        ) : null}
        {onTurnOff ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-extrabold text-[#084865] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
            onClick={onTurnOff}
          >
            Turn off AI view
          </button>
        ) : null}
      </div>
      <p className="mt-4 border-t border-[#e2d9f2] pt-4 text-xs text-slate-500">
        AI cannot book, cancel, disclose data or override your choices. MapAble
        will not create bookings, withdraw consent, choose workers, share
        records, trigger safety outcomes, or send messages from this panel.
      </p>
    </section>
  );
}
