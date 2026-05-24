import type { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";

import { INTERACTIVE_LAYERS, type MapFeatureKind } from "@/lib/map/map-layer-ids";

export interface MapFeatureSelection {
  kind: MapFeatureKind;
  id: string;
  properties: Record<string, unknown>;
  coordinates: [number, number];
}

function kindFromLayer(layerId: string): MapFeatureKind | null {
  if (layerId.includes("providers")) return "provider";
  if (layerId.includes("sponsored")) return "sponsored";
  if (layerId.includes("accessibility")) return "accessibility_place";
  if (layerId.includes("reviews")) return "review";
  if (layerId.includes("pickup")) return "pickup_point";
  if (layerId.includes("dispatch-vehicles")) return "vehicle";
  if (layerId.includes("transport-trips")) return "trip";
  if (layerId.includes("service-zones")) return "service_zone";
  return null;
}

export function queryFeaturesAtPoint(
  map: MapLibreMap,
  event: MapMouseEvent,
): MapFeatureSelection | null {
  const features = map.queryRenderedFeatures(event.point, {
    layers: [...INTERACTIVE_LAYERS].filter((id) => map.getLayer(id)),
  });

  const top = features[0];
  if (!top?.layer?.id || !top.geometry) return null;

  const kind = kindFromLayer(top.layer.id);
  if (!kind) return null;

  const id = String(top.properties?.id ?? top.id ?? "");
  if (!id) return null;

  let coordinates: [number, number] = [event.lngLat.lng, event.lngLat.lat];
  if (top.geometry.type === "Point") {
    coordinates = top.geometry.coordinates as [number, number];
  }

  return {
    kind,
    id,
    properties: { ...top.properties },
    coordinates,
  };
}

export function bindFeatureClickHandler(
  map: MapLibreMap,
  onSelect: (selection: MapFeatureSelection) => void,
): () => void {
  const handler = (event: MapMouseEvent) => {
    const selection = queryFeaturesAtPoint(map, event);
    if (selection) onSelect(selection);
  };

  for (const layerId of INTERACTIVE_LAYERS) {
    map.on("click", layerId, handler);
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  }

  return () => {
    for (const layerId of INTERACTIVE_LAYERS) {
      map.off("click", layerId, handler);
    }
  };
}
