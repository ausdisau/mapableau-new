import {
  listPublishedPlaces,
  placeToGeoJsonFeature,
} from "@/lib/access-map/access-place-service";
import type { MapBbox } from "@/lib/map/map-layer-query";
import { pointInBbox } from "@/lib/map/map-layer-query";

export async function getAccessMapLayerGeoJson(
  bbox: MapBbox,
): Promise<GeoJSON.FeatureCollection> {
  const places = await listPublishedPlaces(500);
  const features = places
    .map((place) => {
      if (!place.location) return null;
      const { latitude, longitude } = place.location;
      if (!pointInBbox(latitude, longitude, bbox)) return null;
      return placeToGeoJsonFeature({
        id: place.id,
        name: place.name,
        category: place.category,
        location: place.location,
      });
    })
    .filter((f): f is NonNullable<typeof f> => f != null);

  return { type: "FeatureCollection", features };
}
