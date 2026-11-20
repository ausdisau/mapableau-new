"use client";

import type { ScheduleMatrixSlot } from "@/lib/transport/schedule/schedule-matrix-service";

type Props = {
  trips: ScheduleMatrixSlot[];
};

/**
 * Source-labelled advisory route summary. Never presents mock as live ETA.
 */
export function ScheduleAdvisoryRoute({ trips }: Props) {
  const withRoutes = trips.filter((t) => t.routeAdvisory);

  if (withRoutes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        No stored route estimates for this window. Estimates are advisory only
        and are never NDIS funding approvals.
      </p>
    );
  }

  return (
    <ul className="space-y-2 text-sm">
      {withRoutes.map((t) => {
        const r = t.routeAdvisory!;
        const km = (r.distanceMetres / 1000).toFixed(1);
        const mins = Math.round(r.durationSeconds / 60);
        return (
          <li key={t.tripId} className="rounded border border-border px-3 py-2">
            <p className="font-medium">
              Trip {t.tripId.slice(0, 8)}… — {km} km, ~{mins} min
            </p>
            <p className="text-muted-foreground">
              Source: <span className="font-mono">{r.sourceLabel}</span>
              {r.provider === "mock" ? (
                <span className="ml-1 text-amber-800 dark:text-amber-200">
                  (sandbox — not live ETA)
                </span>
              ) : null}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
