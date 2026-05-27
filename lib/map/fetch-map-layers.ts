import { bboxToSearchParams, bboxFromCenter } from "@/lib/map/bbox-from-center";
import type { MapBbox } from "@/lib/map/map-layer-query";

export type MapLayerVisibility = {
  access: boolean;
  care: boolean;
  transport: boolean;
};

export type MapLayerPayload = {
  access: GeoJSON.FeatureCollection | null;
  care: GeoJSON.FeatureCollection | null;
  transportLines: GeoJSON.FeatureCollection | null;
  transportStops: GeoJSON.FeatureCollection | null;
};

const emptyCollection = (): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: [],
});

export function mapBboxKey(bbox: MapBbox): string {
  return [
    bbox.minLat.toFixed(4),
    bbox.minLng.toFixed(4),
    bbox.maxLat.toFixed(4),
    bbox.maxLng.toFixed(4),
  ].join(",");
}

export function searchCenterToBbox(
  center: { lat: number; lng: number },
  radiusKm: number,
): MapBbox {
  return bboxFromCenter(center.lat, center.lng, radiusKm);
}

export async function fetchMapLayers(params: {
  bbox: MapBbox;
  visibility: MapLayerVisibility;
  isSignedIn: boolean;
}): Promise<MapLayerPayload> {
  const qs = bboxToSearchParams(params.bbox).toString();
  const base = `/api/map/layers`;

  const accessPromise = params.visibility.access
    ? fetch(`${base}/access?${qs}`).then(async (res) => {
        if (!res.ok) return emptyCollection();
        return (await res.json()) as GeoJSON.FeatureCollection;
      })
    : Promise.resolve(null);

  const carePromise =
    params.isSignedIn && params.visibility.care
      ? fetch(`${base}/care?${qs}`).then(async (res) => {
          if (!res.ok) return emptyCollection();
          return (await res.json()) as GeoJSON.FeatureCollection;
        })
      : Promise.resolve(null);

  const transportPromise =
    params.isSignedIn && params.visibility.transport
      ? fetch(`${base}/transport?${qs}`).then(async (res) => {
          if (!res.ok) {
            return {
              lines: emptyCollection(),
              stops: emptyCollection(),
            };
          }
          return (await res.json()) as {
            lines: GeoJSON.FeatureCollection;
            stops: GeoJSON.FeatureCollection;
          };
        })
      : Promise.resolve(null);

  const [access, care, transport] = await Promise.all([
    accessPromise,
    carePromise,
    transportPromise,
  ]);

  return {
    access,
    care,
    transportLines: transport?.lines ?? null,
    transportStops: transport?.stops ?? null,
  };
}
