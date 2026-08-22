"use client";

import { GAIS_EVIDENCE_STATE_LABELS } from "@/lib/gais/contracts/evidence";
import type { GaisAccessConditionEvent } from "@/lib/gais/conditions";

function formatDate(iso?: string): string {
  if (!iso) return "Unknown";
  try {
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "Unknown";
  }
}

function ConditionItem({ event }: { event: GaisAccessConditionEvent }) {
  const evidenceLabel =
    event.evidence[0]?.sourceType === "UNKNOWN"
      ? "Current status unknown"
      : GAIS_EVIDENCE_STATE_LABELS[event.evidence[0]?.sourceType ?? "UNKNOWN"];

  return (
    <li className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2 text-sm">
      <p className="font-semibold text-amber-950">{event.label}</p>
      {event.description ? (
        <p className="mt-1 text-xs text-amber-900">{event.description}</p>
      ) : null}
      <p className="mt-1 text-xs text-amber-800">
        Reported: {formatDate(event.reportedAt)}
        {event.expiresAt ? ` · Expected until ${formatDate(event.expiresAt)}` : ""}
      </p>
      <p className="mt-0.5 text-xs text-amber-700">Source: {evidenceLabel}</p>
    </li>
  );
}

export function AccessConditionsPanel({
  events,
  loading,
  error,
  compact = false,
}: {
  events: GaisAccessConditionEvent[];
  loading?: boolean;
  error?: string | null;
  compact?: boolean;
}) {
  return (
    <section
      aria-labelledby="access-conditions-heading"
      className={compact ? "" : "rounded-2xl border border-slate-200 bg-white p-4"}
    >
      <h2
        id="access-conditions-heading"
        className={compact ? "text-xs font-bold uppercase tracking-wide text-amber-900" : "text-lg font-bold"}
      >
        Current access conditions
      </h2>
      <p className={`${compact ? "mt-1 text-xs" : "mt-1 text-sm"} text-slate-600`} role="note">
        Factual, time-aware reports — not predictions or route safety verdicts.
      </p>

      {loading ? (
        <p className="mt-2 text-sm text-slate-600" role="status">
          Loading access conditions…
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && events.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          No active access conditions reported for this area.
        </p>
      ) : null}

      {events.length ? (
        <ul
          className={`${compact ? "mt-2" : "mt-3"} space-y-2`}
          aria-label="Current access conditions"
        >
          {events.map((event) => (
            <ConditionItem key={event.id} event={event} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
