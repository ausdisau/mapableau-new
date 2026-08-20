"use client";

import dynamic from "next/dynamic";

import type { RouteOption } from "@/lib/go/contracts/route-contracts";

const AccessMapLayer = dynamic(
  () => import("@/components/access/AccessMapLayer").then((m) => m.AccessMapLayer),
  { ssr: false, loading: () => <p className="text-sm">Loading map…</p> },
);

export function GoMap({
  route,
  places,
}: {
  route: RouteOption;
  places: Array<{
    id: string;
    name: string;
    latitude?: number;
    longitude?: number;
  }>;
}) {
  const mapPlaces = places.filter((p) => p.latitude != null && p.longitude != null);

  return (
    <section aria-labelledby="go-map-heading">
      <h2 id="go-map-heading" className="sr-only">
        Map view
      </h2>
      <p className="mb-2 text-sm text-muted-foreground">
        Map shows destination context. All functions are available in list and guided modes without
        map interaction.
      </p>
      <div className="h-72 overflow-hidden rounded-xl border md:h-96">
        <AccessMapLayer
          places={mapPlaces.map((p) => ({
            id: p.id,
            name: p.name,
            latitude: p.latitude!,
            longitude: p.longitude!,
          }))}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Route: {route.segmentIds.length} segments, {route.distanceMetres} m. Pilot sandbox graph —
        not live national coverage.
      </p>
    </section>
  );
}
