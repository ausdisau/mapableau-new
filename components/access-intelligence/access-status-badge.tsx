"use client";

import React from "react";

import { cn } from "@/app/lib/utils";
import type { DecisionStatus } from "@/lib/access-intelligence/schemas";

const STATUS_META: Record<
  DecisionStatus,
  { label: string; icon: string; className: string }
> = {
  suitable: {
    label: "Suitable",
    icon: "✓",
    className: "border-emerald-700 bg-emerald-50 text-emerald-900",
  },
  suitable_with_conditions: {
    label: "Suitable with conditions",
    icon: "!",
    className: "border-amber-700 bg-amber-50 text-amber-950",
  },
  blocked: {
    label: "Blocked",
    icon: "✕",
    className: "border-red-700 bg-red-50 text-red-900",
  },
  unknown: {
    label: "Information incomplete",
    icon: "?",
    className: "border-slate-600 bg-slate-100 text-slate-900",
  },
};

export function AccessStatusBadge({
  status,
  className,
}: {
  status: DecisionStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-black",
        meta.className,
        className,
      )}
      role="status"
      aria-label={`Access status: ${meta.label}`}
    >
      <span aria-hidden="true" className="text-base">
        {meta.icon}
      </span>
      {meta.label}
    </span>
  );
}

export function ConfidenceIndicator({
  value,
  label,
}: {
  value: number | null;
  label?: string;
}) {
  const text =
    label ??
    (value == null
      ? "unknown"
      : value >= 80
        ? "high"
        : value >= 60
          ? "moderate"
          : value >= 35
            ? "limited"
            : "very limited");
  return (
    <p className="text-sm text-slate-700">
      <span className="font-semibold">Evidence confidence:</span>{" "}
      <span className="capitalize">{text}</span>
      {value != null ? ` (${value}/100)` : null}
    </p>
  );
}
