import type { GeoJSONSource, Map as MapLibreMap, LayerSpecification } from "maplibre-gl";

export function ensureGeoJsonSource(
  map: MapLibreMap,
  sourceId: string,
  data: GeoJSON.FeatureCollection,
): void {
  const existing = map.getSource(sourceId) as GeoJSONSource | undefined;
  if (existing) {
    existing.setData(data);
    return;
  }
  map.addSource(sourceId, { type: "geojson", data });
}

export function syncGeoJsonSource(
  map: MapLibreMap,
  sourceId: string,
  data: GeoJSON.FeatureCollection | null | undefined,
): void {
  if (!data) return;
  ensureGeoJsonSource(map, sourceId, data);
}

export function ensureLayer(
  map: MapLibreMap,
  layer: LayerSpecification,
  beforeId?: string,
): void {
  if (map.getLayer(layer.id)) return;
  map.addLayer(layer, beforeId);
}

export function setLayerVisibility(
  map: MapLibreMap,
  layerId: string,
  visible: boolean,
): void {
  if (!map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
}

export function setLayersVisibility(
  map: MapLibreMap,
  layerIds: string[],
  visible: boolean,
): void {
  for (const id of layerIds) {
    setLayerVisibility(map, id, visible);
  }
}
