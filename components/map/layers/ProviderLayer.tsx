"use client";

import { useMemo } from "react";

import type { Provider } from "@/app/provider-finder/providers";
import { useGeoJsonLayer } from "@/components/map/layers/useGeoJsonLayer";
import { MAP_LAYERS, MAP_SOURCES } from "@/lib/map/map-layer-ids";
import { emptyFeatureCollection } from "@/lib/map/map-sources";

const locationToCoords: Record<string, [number, number]> = {
  "Parramatta NSW": [151.0033, -33.8148],
  "Footscray VIC": [144.9, -37.8],
  "Morphett Vale SA": [138.5167, -35.1167],
  "Bayswater WA": [115.9167, -31.9167],
  "Chermside QLD": [153.0333, -27.3833],
  "Civic ACT": [149.1333, -35.2833],
  "Hobart TAS": [147.3167, -42.8833],
  "Darwin City NT": [130.8456, -12.4634],
  "Mildura VIC": [142.15, -34.1833],
  "Newcastle NSW": [151.7817, -32.9283],
  "Geelong VIC": [144.35, -38.15],
};

export function getProviderCoordinates(provider: Provider): [number, number] | null {
  if (
    provider.latitude != null &&
    provider.longitude != null &&
    (provider.latitude !== 0 || provider.longitude !== 0)
  ) {
    return [provider.longitude, provider.latitude];
  }
  if (provider.suburb === "Remote") return null;
  return locationToCoords[`${provider.suburb} ${provider.state}`] ?? null;
}

export function providersToFeatureCollection(
  providers: Provider[],
  selectedId?: string | null,
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (const provider of providers) {
    const coords = getProviderCoordinates(provider);
    if (!coords) continue;
    features.push({
      type: "Feature",
      id: provider.id,
      geometry: { type: "Point", coordinates: coords },
      properties: {
        id: provider.id,
        name: provider.name,
        suburb: provider.suburb,
        state: provider.state,
        postcode: provider.postcode,
        registered: provider.registered,
        rating: provider.rating,
        reviewCount: provider.reviewCount,
        categories: provider.categories.join(", "),
        selected: provider.id === selectedId,
      },
    });
  }

  return { type: "FeatureCollection", features };
}

type ProviderLayerProps = {
  providers: Provider[];
  selectedId?: string | null;
};

export function ProviderLayer({ providers, selectedId }: ProviderLayerProps) {
  const data = useMemo(
    () => providersToFeatureCollection(providers, selectedId),
    [providers, selectedId],
  );

  useGeoJsonLayer({
    sourceId: MAP_SOURCES.providers,
    data: data.features.length > 0 ? data : emptyFeatureCollection(),
    layers: [
      {
        id: MAP_LAYERS.providersCircle,
        type: "circle",
        source: MAP_SOURCES.providers,
        paint: {
          "circle-radius": [
            "case",
            ["boolean", ["get", "selected"], false],
            11,
            8,
          ],
          "circle-color": [
            "case",
            ["boolean", ["get", "selected"], false],
            "#dc2626",
            "#2563eb",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      },
      {
        id: MAP_LAYERS.providersSymbol,
        type: "symbol",
        source: MAP_SOURCES.providers,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-offset": [0, 1.4],
          "text-anchor": "top",
          "text-max-width": 12,
        },
        paint: {
          "text-color": "#1e293b",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        },
      },
    ],
  });

  return null;
}
