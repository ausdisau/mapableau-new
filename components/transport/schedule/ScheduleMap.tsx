"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import type { ScheduleMatrixSlot } from "@/lib/transport/schedule/schedule-matrix-service";

const ScheduleMapInner = dynamic(
  () =>
    import("@/components/transport/schedule/ScheduleMapInner").then(
      (m) => m.ScheduleMapInner
    ),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted-foreground" role="status">
        Loading map…
      </p>
    ),
  }
);

type Props = {
  trips: ScheduleMatrixSlot[];
  enabled?: boolean;
};

/**
 * Optional Leaflet map. When disabled/offline, callers must keep the trip table visible.
 */
export function ScheduleMap({ trips, enabled = false }: Props) {
  const mapOn = enabled;
  const points = useMemo(
    () =>
      trips.flatMap((t) => {
        const out: Array<{
          id: string;
          label: string;
          lat: number;
          lng: number;
          href: string;
        }> = [];
        if (t.pickupCoordinates) {
          out.push({
            id: `${t.tripId}-pickup`,
            label: `Pickup: ${t.pickupLabel}`,
            lat: t.pickupCoordinates.lat,
            lng: t.pickupCoordinates.lng,
            href: t.dispatchHref,
          });
        }
        if (t.dropoffCoordinates) {
          out.push({
            id: `${t.tripId}-dropoff`,
            label: `Drop-off: ${t.dropoffLabel}`,
            lat: t.dropoffCoordinates.lat,
            lng: t.dropoffCoordinates.lng,
            href: t.dispatchHref,
          });
        }
        return out;
      }),
    [trips]
  );

  if (!mapOn) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Map view is disabled. Use the trip table above (map–list parity).
      </p>
    );
  }

  if (points.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        No disclosable coordinates for the current assignment stage. Suburb-level
        labels remain in the table.
      </p>
    );
  }

  return <ScheduleMapInner points={points} />;
}
