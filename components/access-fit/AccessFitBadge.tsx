import Link from "next/link";
import React from "react";

import type { AccessFitLabel } from "@/lib/access-fit/types";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

const LABEL_STYLES: Record<AccessFitLabel, string> = {
  "strong fit": "bg-emerald-100 text-emerald-900 border-emerald-300",
  "possible fit": "bg-sky-100 text-sky-900 border-sky-300",
  "needs confirmation": "bg-amber-100 text-amber-950 border-amber-300",
  "likely barrier": "bg-rose-100 text-rose-900 border-rose-300",
  unknown: "bg-slate-100 text-slate-800 border-slate-300",
};

export function AccessFitBadge({
  score,
  label,
  preferencesActive = true,
  needsAnchorHref = "#my-access-needs",
}: {
  score: number;
  label: AccessFitLabel;
  /** When false, do not show a misleading 0/100 · Unknown score. */
  preferencesActive?: boolean;
  needsAnchorHref?: string;
}) {
  if (!preferencesActive) {
    return (
      <p className="inline-flex min-h-11 flex-wrap items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
        <span>Set your access needs to calculate fit</span>
        <Link
          href={needsAnchorHref}
          className={`underline underline-offset-2 ${mapableCareFocusRing}`}
        >
          My access needs
        </Link>
      </p>
    );
  }

  return (
    <p
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold ${LABEL_STYLES[label]}`}
      aria-label={`Access-Fit score ${score} out of 100: ${label}`}
    >
      <span>Access-Fit {score}/100</span>
      <span aria-hidden="true">·</span>
      <span className="capitalize">{label}</span>
    </p>
  );
}
