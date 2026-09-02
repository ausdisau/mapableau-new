"use client";

import React from "react";

import type { AccessFitResultV2, RequirementFit } from "@/lib/access/fit/access-fit-v2-types";
import { accessFitV2SummaryLine } from "@/lib/access/fit/calculate-access-fit-v2";
import { GAIS_EVIDENCE_STATE_LABELS } from "@/lib/gais/contracts/evidence";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

const STATE_LABELS: Record<RequirementFit["state"], string> = {
  MEETS: "Meets",
  DOES_NOT_MATCH: "Does not match",
  UNKNOWN: "Unknown",
};

const STATE_STYLES: Record<RequirementFit["state"], string> = {
  MEETS: "border-emerald-200 bg-emerald-50 text-emerald-900",
  DOES_NOT_MATCH: "border-amber-300 bg-amber-50 text-amber-950",
  UNKNOWN: "border-slate-300 bg-slate-50 text-slate-800",
};

export function AccessFitBreakdownV2({ result }: { result: AccessFitResultV2 }) {
  const meets = result.requirements.filter((r) => r.state === "MEETS");
  const unmet = result.requirements.filter((r) => r.state === "DOES_NOT_MATCH");
  const unknown = result.requirements.filter((r) => r.state === "UNKNOWN");

  return (
    <section
      aria-labelledby="access-fit-v2-heading"
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
    >
      <div>
        <h2 id="access-fit-v2-heading" className="text-lg font-semibold text-[#0C1833]">
          Access fit for your selected requirements
        </h2>
        <p className="mt-2 text-sm text-slate-700" role="status">
          {accessFitV2SummaryLine(result)}
        </p>
        {result.unknownCount > 0 ? (
          <p className="mt-1 text-sm text-slate-600">
            {result.unknownCount} requirement
            {result.unknownCount === 1 ? "" : "s"} have unknown evidence — MapAble does not
            treat unknown as inaccessible.
          </p>
        ) : null}
      </div>

      <EvidenceSummaryStrip summary={result.evidenceSummary} />

      <RequirementFitGroup title="Meets" items={meets} empty="No requirements with supporting evidence yet." />
      <RequirementFitGroup
        title="Does not match"
        items={unmet}
        empty="No reported mismatches for your selected requirements."
      />
      <RequirementFitGroup
        title="Unknown"
        items={unknown}
        empty="No unknown requirements."
      />
    </section>
  );
}

function EvidenceSummaryStrip({
  summary,
}: {
  summary: AccessFitResultV2["evidenceSummary"];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[#F6FBFC] p-3 text-sm text-slate-700">
      <p className="font-semibold text-[#0C1833]">Supporting evidence</p>
      <ul className="mt-2 flex flex-wrap gap-3">
        <li>
          <span className="font-medium">Dominant state:</span>{" "}
          {GAIS_EVIDENCE_STATE_LABELS[summary.dominantState]}
        </li>
        {summary.verifiedCount > 0 ? (
          <li>Verified refs: {summary.verifiedCount}</li>
        ) : null}
        {summary.communityCount > 0 ? (
          <li>Community reported: {summary.communityCount}</li>
        ) : null}
        {summary.staleCount > 0 ? (
          <li>Stale/low confidence: {summary.staleCount}</li>
        ) : null}
        {summary.disputedCount > 0 ? (
          <li>Disputed: {summary.disputedCount}</li>
        ) : null}
      </ul>
    </div>
  );
}

function RequirementFitGroup({
  title,
  items,
  empty,
}: {
  title: string;
  items: RequirementFit[];
  empty: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[#0C1833]">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <li
              key={item.requirementId}
              className={`rounded-lg border px-3 py-2 text-sm ${STATE_STYLES[item.state]}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{item.label}</span>
                <span className="text-xs font-bold uppercase tracking-wide">
                  {STATE_LABELS[item.state]}
                </span>
              </div>
              {item.explanation ? (
                <p className="mt-1">{item.explanation}</p>
              ) : null}
              {item.evidenceRefs.length > 0 ? (
                <details className="mt-2">
                  <summary
                    className={`cursor-pointer text-xs font-semibold underline ${mapableInteractiveFocusRing}`}
                  >
                    Evidence ({item.evidenceRefs.length})
                  </summary>
                  <ul className="mt-1 space-y-1 text-xs">
                    {item.evidenceRefs.map((ref, index) => (
                      <li key={`${item.requirementId}-${index}`}>
                        {GAIS_EVIDENCE_STATE_LABELS[ref.sourceType]}
                        {ref.sourceLabel ? ` — ${ref.sourceLabel}` : ""}
                        {ref.observedAt ? ` · Last checked ${ref.observedAt}` : ""}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
