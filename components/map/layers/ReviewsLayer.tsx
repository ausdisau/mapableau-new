"use client";

import { useMemo } from "react";

import { useGeoJsonLayer } from "@/components/map/layers/useGeoJsonLayer";
import { getMapConfig } from "@/lib/map/map-config";
import { MAP_LAYERS, MAP_SOURCES } from "@/lib/map/map-layer-ids";
import { emptyFeatureCollection } from "@/lib/map/map-sources";

export interface ReviewMapFeature {
  id: string;
  lng: number;
  lat: number;
  subjectName: string;
  ratingSummary: string;
  reviewCount: number;
}

type ReviewsLayerProps = {
  reviews: ReviewMapFeature[];
};

export function ReviewsLayer({ reviews }: ReviewsLayerProps) {
  const enabled = getMapConfig().MAP_ENABLE_REVIEWS_LAYER !== false;

  const data = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: reviews.map((review) => ({
        type: "Feature",
        id: review.id,
        geometry: { type: "Point", coordinates: [review.lng, review.lat] },
        properties: {
          id: review.id,
          subjectName: review.subjectName,
          ratingSummary: review.ratingSummary,
          reviewCount: review.reviewCount,
        },
      })),
    }),
    [reviews],
  );

  useGeoJsonLayer({
    sourceId: MAP_SOURCES.reviews,
    data: data.features.length > 0 ? data : emptyFeatureCollection(),
    enabled,
    layers: [
      {
        id: MAP_LAYERS.reviews,
        type: "symbol",
        source: MAP_SOURCES.reviews,
        layout: {
          "text-field": "★",
          "text-size": 16,
        },
        paint: {
          "text-color": "#ca8a04",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        },
      },
    ],
  });

  return null;
}
