"use client";

import Link from "next/link";

import type { ScheduleMatrixSlot } from "@/lib/transport/schedule/schedule-matrix-service";

type Props = {
  trips: ScheduleMatrixSlot[];
  timeZone: string;
};

function formatLocal(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    hour12: false,
  }).format(new Date(iso));
}

/**
 * Accessible trip list — fully usable without map, colour, or drag-and-drop.
 */
export function ScheduleTripTable({ trips, timeZone }: Props) {
  if (trips.length === 0) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        No trips in this window. Use Dispatch to assign verified drivers and
        vehicles, or adjust the day filter.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <caption className="sr-only">
          Transport schedule trips for the selected day. Links open the dispatch
          board for human assignment.
        </caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-2 pr-3 font-medium">
              Start
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Status
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Driver
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Vehicle
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Pickup
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Drop-off
            </th>
            <th scope="col" className="py-2 font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {trips.map((trip) => (
            <tr key={trip.tripId} className="border-b align-top">
              <td className="py-2 pr-3 whitespace-nowrap">
                <time dateTime={trip.scheduledStart}>
                  {formatLocal(trip.scheduledStart, timeZone)}
                </time>
              </td>
              <td className="py-2 pr-3">
                <span>{trip.status.replace(/_/g, " ")}</span>
                {trip.requestStatus ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Request: {trip.requestStatus}
                  </span>
                ) : null}
                {trip.routeAdvisory ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Route: {trip.routeAdvisory.sourceLabel}
                  </span>
                ) : null}
              </td>
              <td className="py-2 pr-3">{trip.driverName ?? "Unassigned"}</td>
              <td className="py-2 pr-3">{trip.vehicleName ?? "—"}</td>
              <td className="py-2 pr-3">{trip.pickupLabel}</td>
              <td className="py-2 pr-3">{trip.dropoffLabel}</td>
              <td className="py-2">
                <Link
                  href={trip.dispatchHref}
                  className="text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Open in dispatch
                  <span className="sr-only"> for trip {trip.tripId}</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
