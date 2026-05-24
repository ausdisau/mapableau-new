"use client";

import { useMemo } from "react";

import type { Provider } from "@/app/provider-finder/providers";
import { ProviderLayer } from "@/components/map/layers/ProviderLayer";
import { MapLibreMap } from "@/components/map/MapLibreMap";
import { getLocationCoords } from "@/lib/locationCoords";
import { pointsToBounds } from "@/lib/map/map-bounds";

import type { ProviderWithRelations } from "./types";

type ProviderLocationMapClientProps = {
  provider: ProviderWithRelations;
};

export default function ProviderLocationMapClient({
  provider,
}: ProviderLocationMapClientProps) {
  const mapProviders = useMemo(
    () =>
      provider.locations.map((loc, index) => {
        const coords = getLocationCoords(loc.city, loc.state, loc.address);
        return {
          id: `${provider.id}-${index}`,
          slug: provider.id,
          name: provider.name,
          suburb: loc.city ?? "Unknown",
          state: (loc.state ?? "NSW") as Provider["state"],
          postcode: loc.postcode ?? "",
          distanceKm: 0,
          rating: provider.rating ?? 0,
          reviewCount: provider.reviewCount ?? 0,
          registered: true,
          categories: [],
          supports: [] as never[],
          latitude: coords?.[0],
          longitude: coords?.[1],
        };
      }),
    [provider],
  );

  const bounds = useMemo(() => {
    const points = mapProviders
      .map((item) =>
        item.latitude != null && item.longitude != null
          ? { lng: item.longitude, lat: item.latitude }
          : null,
      )
      .filter(Boolean) as Array<{ lng: number; lat: number }>;
    return pointsToBounds(points);
  }, [mapProviders]);

  if (provider.locations.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg">Service Areas</h2>
      <MapLibreMap className="relative h-[320px] w-full overflow-hidden rounded-xl border border-border" bounds={bounds}>
        <ProviderLayer providers={mapProviders} />
      </MapLibreMap>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {provider.locations.map((loc) => (
          <li key={loc.id}>
            {[loc.address, loc.city, loc.state, loc.postcode]
              .filter(Boolean)
              .join(", ")}
          </li>
        ))}
      </ul>
    </section>
  );
}
