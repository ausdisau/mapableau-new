"use client";

import type { AccessFactState } from "@/types/access-preflight";

const LABELS: Record<AccessFactState, string> = {
  confirmed: "Confirmed",
  unavailable: "Unavailable",
  unknown: "Unknown",
  not_applicable: "Not applicable",
};

const STYLES: Record<AccessFactState, string> = {
  confirmed: "bg-emerald-100 text-emerald-950 border-emerald-700",
  unavailable: "bg-rose-100 text-rose-950 border-rose-700",
  unknown: "bg-amber-100 text-amber-950 border-amber-700",
  not_applicable: "bg-slate-100 text-slate-800 border-slate-500",
};

export function AccessFactStatus({ state }: { state: AccessFactState }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-lg border px-2 text-xs font-black ${STYLES[state]}`}
    >
      {LABELS[state]}
    </span>
  );
}
