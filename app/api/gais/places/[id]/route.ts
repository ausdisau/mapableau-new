import { jsonError, jsonOk } from "@/lib/api/response";
import {
  GAIS_RESPONSE_META,
  gaisFeatureDisabledResponse,
  mapableGaisFlags,
} from "@/lib/config/mapable-gais";
import { gaisFeaturesToFeatureCollection } from "@/lib/gais/geojson";
import { getGaisPlace } from "@/lib/gais/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  if (!mapableGaisFlags.readEnabled) {
    return gaisFeatureDisabledResponse("MAPABLE_GAIS_PUBLIC_API_ENABLED");
  }

  const { id } = await params;
  const place = await getGaisPlace(id);
  if (!place) {
    return jsonError("Place not found", 404);
  }

  const collection = gaisFeaturesToFeatureCollection(place.features, {
    claimState: GAIS_RESPONSE_META.claimState,
    evidenceScope: place.evidenceScope,
  });

  return jsonOk({
    place: {
      placeId: place.placeId,
      name: place.name,
      category: place.category,
      suburb: place.suburb,
      geometry: place.geometry,
    },
    type: collection.type,
    features: collection.features,
    meta: collection.meta,
  });
}
