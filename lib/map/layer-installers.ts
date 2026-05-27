import type { Map as MapLibreMap } from "maplibre-gl";

import { MAP_LAYER_IDS, MAP_SOURCE_IDS } from "@/lib/map/map-layer-ids";
import { ensureGeoJsonSource, ensureLayer } from "@/lib/map/use-map-layers";

const empty: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

export function installBaseMapLayers(map: MapLibreMap): void {
  ensureGeoJsonSource(map, MAP_SOURCE_IDS.transportTrips, empty);
  ensureGeoJsonSource(map, MAP_SOURCE_IDS.accessPlaces, empty);
  ensureGeoJsonSource(map, MAP_SOURCE_IDS.careShifts, empty);
  ensureGeoJsonSource(map, MAP_SOURCE_IDS.transportStops, empty);
  ensureGeoJsonSource(map, MAP_SOURCE_IDS.providers, empty);
  ensureGeoJsonSource(map, MAP_SOURCE_IDS.userLocation, empty);

  ensureLayer(map, {
    id: MAP_LAYER_IDS.transportTrips,
    type: "line",
    source: MAP_SOURCE_IDS.transportTrips,
    layout: { visibility: "none" },
    paint: {
      "line-color": "#2563eb",
      "line-width": 3,
      "line-opacity": 0.75,
    },
  });

  ensureLayer(map, {
    id: MAP_LAYER_IDS.accessPlaces,
    type: "circle",
    source: MAP_SOURCE_IDS.accessPlaces,
    layout: { visibility: "visible" },
    paint: {
      "circle-radius": 6,
      "circle-color": "#d97706",
      "circle-stroke-width": 1,
      "circle-stroke-color": "#ffffff",
    },
  });

  ensureLayer(map, {
    id: MAP_LAYER_IDS.careShifts,
    type: "circle",
    source: MAP_SOURCE_IDS.careShifts,
    layout: { visibility: "none" },
    paint: {
      "circle-radius": 7,
      "circle-color": "#7c3aed",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  });

  ensureLayer(map, {
    id: MAP_LAYER_IDS.pickupPoints,
    type: "circle",
    source: MAP_SOURCE_IDS.transportStops,
    layout: { visibility: "none" },
    paint: {
      "circle-radius": 5,
      "circle-color": [
        "match",
        ["get", "stopType"],
        "pickup",
        "#16a34a",
        "dropoff",
        "#dc2626",
        "#64748b",
      ],
      "circle-stroke-width": 1,
      "circle-stroke-color": "#ffffff",
    },
  });

  ensureLayer(map, {
    id: MAP_LAYER_IDS.providers,
    type: "circle",
    source: MAP_SOURCE_IDS.providers,
    paint: {
      "circle-radius": 8,
      "circle-color": "#0f766e",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  });

  ensureLayer(map, {
    id: MAP_LAYER_IDS.userLocation,
    type: "circle",
    source: MAP_SOURCE_IDS.userLocation,
    layout: { visibility: "none" },
    paint: {
      "circle-radius": 10,
      "circle-color": "#0284c7",
      "circle-stroke-width": 3,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.9,
    },
  });
}
