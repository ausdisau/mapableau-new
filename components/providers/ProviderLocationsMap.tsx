"use client";

import React from "react";
import dynamic from "next/dynamic";

import type { PublicProviderRegion } from "@/types/provider-profile";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <p className="text-sm text-muted-foreground" role="status">
      Loading map…
    </p>
  ),
});

type ProviderLocationsMapProps = {
  regions: PublicProviderRegion[];
  latitude?: number;
  longitude?: number;
  providerName: string;
};

export function ProviderLocationsMap({
  regions,
  latitude,
  longitude,
  providerName,
}: ProviderLocationsMapProps) {
  const hasCoords =
    latitude != null &&
    longitude != null &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  return (
    <section aria-labelledby="locations-heading" className="space-y-4">
      <h2
        id="locations-heading"
        className="font-heading text-xl font-semibold text-foreground"
      >
        Service regions
      </h2>
      <ul className="space-y-2">
        {regions.map((region) => (
          <li
            key={region.id}
            className="rounded-lg border border-border/60 bg-card px-4 py-3 text-sm text-foreground"
          >
            {region.label}
          </li>
        ))}
      </ul>
      {hasCoords ? (
        <div className="overflow-hidden rounded-xl border border-border/60">
          <div className="h-64 sm:h-80">
            <Map
              providers={[
                {
                  id: "profile-pin",
                  slug: "profile",
                  name: providerName,
                  suburb: regions[0]?.suburb ?? "",
                  state: (regions[0]?.state ?? "NSW") as "NSW",
                  postcode: regions[0]?.postcode ?? "",
                  distanceKm: 0,
                  rating: 0,
                  reviewCount: 0,
                  registered: false,
                  categories: [],
                  supports: ["In-person"],
                  latitude,
                  longitude,
                },
              ]}
            />
          </div>
          <p className="border-t border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Map shows approximate service area only. Exact addresses are not
            published for privacy.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          A map pin is not available for this listing. Use the regions listed
          above to see where services are offered.
        </p>
      )}
    </section>
  );
}
