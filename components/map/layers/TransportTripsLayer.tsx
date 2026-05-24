"use client";

import { useMemo } from "react";

import { useGeoJsonLayer } from "@/components/map/layers/useGeoJsonLayer";
import { getMapConfig } from "@/lib/map/map-config";
import { MAP_LAYERS, MAP_SOURCES } from "@/lib/map/map-layer-ids";
import { emptyFeatureCollection } from "@/lib/map/map-sources";

export interface TransportTripFeature {
  id: string;
  route: GeoJSON.LineString;
  pickup: [number, number];
  dropoff: [number, number];
  label: string;
}

type TransportTripsLayerProps = {
  trips: TransportTripFeature[];
  canView: boolean;
};

export function TransportTripsLayer({ trips, canView }: TransportTripsLayerProps) {
  const dispatchEnabled = getMapConfig().MAP_ENABLE_DISPATCH_LAYER === true;
  const enabled = canView && dispatchEnabled;

  const data = useMemo<GeoJSON.FeatureCollection>(() => {
    const features: GeoJSON.Feature[] = [];
    for (const trip of trips) {
      features.push({
        type: "Feature",
        id: `${trip.id}-route`,
        geometry: trip.route,
        properties: { id: trip.id, label: trip.label, part: "route" },
      });
      features.push({
        type: "Feature",
        id: `${trip.id}-pickup`,
        geometry: { type: "Point", coordinates: trip.pickup },
        properties: { id: trip.id, label: `${trip.label} pickup`, part: "pickup" },
      });
      features.push({
        type: "Feature",
        id: `${trip.id}-dropoff`,
        geometry: { type: "Point", coordinates: trip.dropoff },
        properties: { id: trip.id, label: `${trip.label} dropoff`, part: "dropoff" },
      });
    }
    return { type: "FeatureCollection", features };
  }, [trips]);

  useGeoJsonLayer({
    sourceId: MAP_SOURCES.transportTrips,
    data: enabled && data.features.length > 0 ? data : emptyFeatureCollection(),
    enabled,
    layers: [
      {
        id: MAP_LAYERS.transportTripsLine,
        type: "line",
        source: MAP_SOURCES.transportTrips,
        filter: ["==", ["get", "part"], "route"],
        paint: {
          "line-color": "#0ea5e9",
          "line-width": 3,
        },
      },
      {
        id: MAP_LAYERS.transportTripsPoints,
        type: "circle",
        source: MAP_SOURCES.transportTrips,
        filter: ["!=", ["get", "part"], "route"],
        paint: {
          "circle-radius": 6,
          "circle-color": "#0284c7",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      },
    ],
  });

  return null;
}
