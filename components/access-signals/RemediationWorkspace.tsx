"use client";

import Link from "next/link";
import { useState } from "react";

import { RaguIcon } from "@/components/access-signals/RaguIcon";
import { REMEDIATION_ISSUES } from "@/lib/access-signals/demo-data";
import { RAGU_LEGEND, raguAnnouncement } from "@/lib/access-signals/ragu";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function RemediationWorkspace() {
  const [selectedId, setSelectedId] = useState(REMEDIATION_ISSUES[0].id);
  const selected =
    REMEDIATION_ISSUES.find((issue) => issue.id === selectedId) ??
    REMEDIATION_ISSUES[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold text-[#0C1833] sm:text-4xl">
          Remediation workspace
        </h1>
        <p className="text-slate-600">
          Track barriers, evidence and next steps
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section
          aria-labelledby="issue-queue-heading"
          className="rounded-2xl border border-slate-200 bg-white"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
            <h2 id="issue-queue-heading" className="font-bold">
              Issue queue ({REMEDIATION_ISSUES.length})
            </h2>
            <p className="text-sm text-slate-600">View: Route requirements</p>
          </div>
          <ul className="divide-y divide-slate-100">
            {REMEDIATION_ISSUES.map((issue) => {
              const active = issue.id === selected.id;
              return (
                <li key={issue.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(issue.id)}
                    aria-current={active ? "true" : undefined}
                    className={`flex w-full min-h-16 items-center gap-3 px-4 py-4 text-left ${mapableInteractiveFocusRing} ${
                      active
                        ? "border-l-4 border-l-red-600 bg-red-50"
                        : "border-l-4 border-l-transparent hover:bg-slate-50"
                    }`}
                  >
                    <RaguIcon status={issue.status} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{issue.status === "unknown" ? "Unknown" : issue.status[0].toUpperCase() + issue.status.slice(1)}</span>
                      <span className="block text-sm text-slate-700">
                        {issue.routeName} — {issue.title.toLowerCase()} /{" "}
                        {issue.domainLabel}
                      </span>
                    </span>
                    <span aria-hidden className="text-slate-400">
                      ›
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section
          aria-labelledby="issue-detail-heading"
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <header className="space-y-2">
            <h2
              id="issue-detail-heading"
              className="font-heading text-3xl font-bold"
            >
              {selected.title}
            </h2>
            <p className="flex flex-wrap items-center gap-2 font-bold text-red-700">
              <RaguIcon status={selected.status} />
              <span>{selected.scopedClaim}</span>
            </p>
            <p className="text-slate-600">
              {selected.routeName} · {selected.domainLabel}
            </p>
          </header>

          <div className="grid gap-3 rounded-xl border border-slate-200 p-3 text-sm sm:grid-cols-2">
            <p>
              <strong>Source:</strong> {selected.source}
            </p>
            <p>
              <strong>Verification:</strong> {selected.verification}
            </p>
          </div>

          <dl className="space-y-3 border-t border-slate-100 pt-3">
            <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
              <dt className="font-semibold">Owner</dt>
              <dd>{selected.owner}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
              <dt className="font-semibold">Next step</dt>
              <dd>{selected.nextStep}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
              <dt className="font-semibold">Reinspection</dt>
              <dd>{selected.reinspection}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              type="button"
              className={`inline-flex min-h-11 items-center rounded-xl bg-[#0F766E] px-4 font-bold text-white ${mapableInteractiveFocusRing}`}
              onClick={() => {
                /* planning placeholder only */
              }}
            >
              Plan remediation
            </button>
            <Link
              href="/access-signals/evidence"
              className={`inline-flex min-h-11 items-center font-bold text-[#0F766E] underline ${mapableInteractiveFocusRing}`}
            >
              View evidence
            </Link>
          </div>
          <p className="text-sm text-slate-600" role="status">
            Selected signal: {raguAnnouncement(selected.status)}. Planning only —
            no work order is created in this demo.
          </p>
        </section>
      </div>

      <section
        aria-label="RAGU legend"
        className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
      >
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {RAGU_LEGEND.map((item) => (
            <li key={item.status} className="flex items-center gap-2 text-sm">
              <RaguIcon status={item.status} />
              <span>{item.legendDescription}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-start gap-2 text-sm text-slate-600">
          <span aria-hidden className="font-bold text-sky-700">
            i
          </span>
          Status is scoped to one route requirement and is not an urgent-hazard
          claim.
        </p>
      </section>
    </div>
  );
}
