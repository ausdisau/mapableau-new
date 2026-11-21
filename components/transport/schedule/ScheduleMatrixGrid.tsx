"use client";

import Link from "next/link";

import type {
  ScheduleMatrixProjection,
  ScheduleMatrixRow,
} from "@/lib/transport/schedule/schedule-matrix-service";

type Props = {
  matrix: ScheduleMatrixProjection;
  resourceFilter: "driver" | "vehicle";
};

function slotLabel(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/**
 * Read-only 15-minute resource × time matrix.
 * Keyboard / screen-reader usable; no drag-and-drop.
 */
export function ScheduleMatrixGrid({ matrix, resourceFilter }: Props) {
  const rows: ScheduleMatrixRow[] = matrix.rows.filter(
    (r) => r.resourceType === resourceFilter
  );
  // Sample every hour for header density; cells still align to 15-min slots.
  const headerSlots = matrix.slotStarts.filter((_, i) => i % 4 === 0);

  return (
    <div className="overflow-x-auto" role="region" aria-label={`${resourceFilter} schedule matrix`}>
      <table className="w-full min-w-[48rem] border-collapse text-left text-xs">
        <caption className="sr-only">
          {resourceFilter} schedule matrix in {matrix.slotMinutes}-minute slots,
          timezone {matrix.timeZone}. Cells link to dispatch; this view does not
          assign resources.
        </caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="sticky left-0 bg-background py-2 pr-3 font-medium">
              {resourceFilter === "driver" ? "Driver" : "Vehicle"}
            </th>
            {headerSlots.map((iso) => (
              <th key={iso} scope="col" className="px-1 py-2 font-medium whitespace-nowrap">
                {slotLabel(iso, matrix.timeZone)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.resourceId} className="border-b align-top">
              <th
                scope="row"
                className="sticky left-0 bg-background py-2 pr-3 text-sm font-medium"
              >
                {row.resourceLabel}
              </th>
              {headerSlots.map((hourIso) => {
                const hourStart = new Date(hourIso).getTime();
                const hourEnd = hourStart + 60 * 60 * 1000;
                const cellTrips = row.slots.filter((s) => {
                  const start = new Date(s.scheduledStart).getTime();
                  return start >= hourStart && start < hourEnd;
                });
                return (
                  <td key={`${row.resourceId}-${hourIso}`} className="px-1 py-2 align-top">
                    {cellTrips.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <ul className="space-y-1">
                        {cellTrips.map((trip) => (
                          <li key={trip.tripId}>
                            <Link
                              href={trip.dispatchHref}
                              className="block rounded border border-border px-1 py-0.5 text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                            >
                              <span className="sr-only">
                                {trip.status.replace(/_/g, " ")} trip{" "}
                              </span>
                              {slotLabel(trip.scheduledStart, matrix.timeZone)}{" "}
                              {trip.pickupLabel}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          No active {resourceFilter}s for this organisation.
        </p>
      ) : null}
    </div>
  );
}
