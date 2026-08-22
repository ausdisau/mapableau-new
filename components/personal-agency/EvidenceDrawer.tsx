"use client";

import { useId, useState } from "react";

import {
  EVIDENCE_STATE_LABELS,
  type EvidenceStateKey,
} from "@/lib/personal-agency/agency-copy";

export type EvidenceItem = {
  id: string;
  label: string;
  state: EvidenceStateKey;
  detail?: string;
};

const STATE_STYLES: Record<EvidenceStateKey, string> = {
  verified: "bg-emerald-50 text-emerald-900 border-emerald-200",
  government_source: "bg-emerald-50 text-emerald-900 border-emerald-200",
  venue_declared: "bg-sky-50 text-sky-900 border-sky-200",
  community_confirmed: "bg-sky-50 text-sky-900 border-sky-200",
  sensor_observed: "bg-violet-50 text-violet-900 border-violet-200",
  ai_inferred: "bg-amber-50 text-amber-900 border-amber-200",
  unknown: "bg-slate-100 text-slate-700 border-slate-300",
};

export function EvidenceSummary({ items }: { items: EvidenceItem[] }) {
  if (!items.length) {
    return (
      <p className="text-sm text-slate-600">
        No evidence available yet. Unknown does not mean inaccessible.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className={`rounded-lg border px-3 py-2 text-sm ${STATE_STYLES[item.state]}`}
        >
          <span className="font-semibold">{item.label}</span>
          <span className="mx-2" aria-hidden>
            ·
          </span>
          <span>{EVIDENCE_STATE_LABELS[item.state]}</span>
          {item.detail ? (
            <span className="block text-xs opacity-80">{item.detail}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function EvidenceDrawer({
  items,
  triggerLabel = "Why MapAble showed this",
}: {
  items: EvidenceItem[];
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-semibold text-[#005B7F] underline-offset-2 hover:underline focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
      >
        {triggerLabel}
      </button>
      {open ? (
        <div
          id={panelId}
          className="mt-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#005B7F]">
            Why MapAble showed this
          </h3>
          <div className="mt-3">
            <EvidenceSummary items={items} />
          </div>
          <p className="mt-3 text-xs text-slate-600">
            AI inferred and unknown evidence are never presented as verified
            fact.
          </p>
        </div>
      ) : null}
    </div>
  );
}
