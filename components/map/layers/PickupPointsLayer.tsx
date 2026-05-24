"use client";

import { useMemo } from "react";

import { useGeoJsonLayer } from "@/components/map/layers/useGeoJsonLayer";
import { MAP_LAYERS, MAP_SOURCES } from "@/lib/map/map-layer-ids";
import { emptyFeatureCollection } from "@/lib/map/map-sources";

export interface PickupPointFeature {
  id: string;
  lng: number;
  lat: number;
  label: string;
  confidence: "high" | "medium" | "low";
  verified: boolean;
}

const confidenceColor: Record<PickupPointFeature["confidence"], string> = {
  high: "#7c3aed",
  medium: "#a78bfa",
  low: "#c4b5fd",
};

type PickupPointsLayerProps = {
  points: PickupPointFeature[];
};

export function PickupPointsLayer({ points }: PickupPointsLayerProps) {
  const data = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: points.map((point) => ({
        type: "Feature",
        id: point.id,
        geometry: { type: "Point", coordinates: [point.lng, point.lat] },
        properties: {
          id: point.id,
          label: point.label,
          confidence: point.confidence,
          verified: point.verified,
          statusText: `${point.verified ? "Verified" : "Unverified"} · ${point.confidence} confidence`,
        },
      })),
    }),
    [points],
  );

  useGeoJsonLayer({
    sourceId: MAP_SOURCES.pickupPoints,
    data: data.features.length > 0 ? data : emptyFeatureCollection(),
    layers: [
      {
        id: MAP_LAYERS.pickupPoints,
        type: "circle",
        source: MAP_SOURCES.pickupPoints,
        paint: {
          "circle-radius": 8,
          "circle-color": [
            "match",
            ["get", "confidence"],
            "high",
            confidenceColor.high,
            "medium",
            confidenceColor.medium,
            confidenceColor.low,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      },
      {
        id: MAP_LAYERS.pickupPointsSymbol,
        type: "symbol",
        source: MAP_SOURCES.pickupPoints,
        layout: {
          "text-field": ["get", "label"],
          "text-size": 10,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#312e81",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        },
      },
    ],
  });

  return null;
}
