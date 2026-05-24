import type {
  CircleLayerSpecification,
  FillLayerSpecification,
  GeoJSONSourceSpecification,
  LineLayerSpecification,
  Map as MapLibreMap,
  SymbolLayerSpecification,
} from "maplibre-gl";

type LayerSpec =
  | CircleLayerSpecification
  | SymbolLayerSpecification
  | LineLayerSpecification
  | FillLayerSpecification;

export function upsertGeoJsonSource(
  map: MapLibreMap,
  sourceId: string,
  data: GeoJSON.FeatureCollection,
) {
  const existing = map.getSource(sourceId);
  if (existing && "setData" in existing && typeof existing.setData === "function") {
    existing.setData(data);
    return;
  }

  const source: GeoJSONSourceSpecification = {
    type: "geojson",
    data,
  };
  map.addSource(sourceId, source);
}

export function upsertLayer(map: MapLibreMap, layer: LayerSpec, beforeId?: string) {
  if (map.getLayer(layer.id)) return;
  map.addLayer(layer, beforeId);
}

export function removeLayerAndSource(map: MapLibreMap, layerIds: string[], sourceId: string) {
  for (const layerId of layerIds) {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  }
  if (map.getSource(sourceId)) map.removeSource(sourceId);
}

export function emptyFeatureCollection(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}
