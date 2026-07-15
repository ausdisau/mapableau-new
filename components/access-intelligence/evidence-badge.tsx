"use client";

import React from "react";

import { ontologyLabel } from "@/lib/access-intelligence/ontology";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function EvidenceBadge({
  sourceType,
  status,
  observedAt,
  disputed,
}: {
  sourceType: string;
  status: string;
  observedAt?: string;
  disputed?: boolean;
}) {
  const isInference = sourceType === "ai_inference";
  return (
    <span
      className={`inline-flex min-h-9 flex-wrap items-center gap-2 rounded-lg border px-2 py-1 text-xs font-semibold ${
        disputed
          ? "border-red-700 bg-red-50 text-red-900"
          : isInference
            ? "border-slate-500 bg-slate-100 text-slate-800"
            : "border-slate-300 bg-white text-slate-800"
      }`}
      role="status"
      aria-label={`Evidence source ${sourceType.replaceAll("_", " ")}, status ${status}${disputed ? ", disputed" : ""}`}
    >
      <span aria-hidden="true">{isInference ? "⚠" : "◈"}</span>
      <span>{sourceType.replaceAll("_", " ")}</span>
      <span>·</span>
      <span>{status}</span>
      {observedAt ? (
        <>
          <span>·</span>
          <span>{new Date(observedAt).toLocaleDateString()}</span>
        </>
      ) : null}
      {isInference ? <span>(not a measurement)</span> : null}
      {disputed ? <span>disputed</span> : null}
    </span>
  );
}

export function EvidenceDetails({
  title,
  featureType,
  sourceType,
  status,
  observedAt,
  confidence,
  notes,
  disputed,
}: {
  title: string;
  featureType?: string;
  sourceType: string;
  status: string;
  observedAt: string;
  confidence?: number;
  notes?: string;
  disputed?: boolean;
}) {
  return (
    <article className="rounded-xl border border-slate-200 p-3 text-sm">
      <h3 className="font-black text-[#0C1833]">{title}</h3>
      {featureType ? (
        <p className="text-slate-600">{ontologyLabel(featureType)}</p>
      ) : null}
      <div className="mt-2">
        <EvidenceBadge
          sourceType={sourceType}
          status={status}
          observedAt={observedAt}
          disputed={disputed}
        />
      </div>
      {confidence != null ? (
        <p className="mt-2 text-slate-700">
          Claim confidence: {Math.round(confidence * 100)}/100
        </p>
      ) : null}
      {notes ? <p className="mt-1 text-slate-700">{notes}</p> : null}
      <a
        href="#evidence-drawer-panel"
        className={`mt-2 inline-flex min-h-11 items-center text-sm font-bold text-[#005B7F] underline ${mapableCareFocusRing}`}
      >
        View related evidence
      </a>
    </article>
  );
}

export { AccessStatusBadge as SuitabilityStatus } from "./access-status-badge";
