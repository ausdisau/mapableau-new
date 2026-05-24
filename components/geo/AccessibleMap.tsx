"use client";

import React, { useMemo } from "react";

import { getMapLibreConfig } from "@/lib/geo/maplibre";

type AccessibleMapProps = {
  pickupLabel?: string;
  dropoffLabel?: string;
  center?: [number, number];
};

/**
 * MapLibre-ready placeholder: list view always available; map when MAPLIBRE_ENABLED.
 */
export function AccessibleMap({
  pickupLabel,
  dropoffLabel,
  center,
}: AccessibleMapProps) {
  const config = useMemo(() => getMapLibreConfig(), []);

  if (!config.enabled) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <h3 className="font-medium">Trip route (text view)</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {pickupLabel ? <li>Pickup: {pickupLabel}</li> : null}
          {dropoffLabel ? <li>Drop-off: {dropoffLabel}</li> : null}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Interactive map is not enabled in this environment. Your operator can
          still complete the trip.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-[200px] rounded-xl border border-border bg-muted/30 p-4"
      role="img"
      aria-label={`Map showing route from ${pickupLabel ?? "pickup"} to ${dropoffLabel ?? "drop-off"}`}
    >
      <p className="text-sm font-medium">Map preview</p>
      <p className="mt-1 text-xs text-muted-foreground">
        MapLibre style: {config.styleUrl}. Center:{" "}
        {(center ?? config.defaultCenter).join(", ")}.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        {pickupLabel ? <li>Pickup: {pickupLabel}</li> : null}
        {dropoffLabel ? <li>Drop-off: {dropoffLabel}</li> : null}
      </ul>
    </div>
  );
}
