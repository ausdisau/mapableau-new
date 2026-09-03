import { jsonError, jsonOk } from "@/lib/api/response";
import {
  GAIS_RESPONSE_META,
  gaisFeatureDisabledResponse,
  mapableGaisFlags,
} from "@/lib/config/mapable-gais";
import { resolveDestinationByPlaceId } from "@/lib/gais/destination";

type RouteParams = { params: Promise<{ placeId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  if (!mapableGaisFlags.destinationEnabled) {
    return gaisFeatureDisabledResponse("MAPABLE_GAIS_DESTINATION_ENABLED");
  }

  const { placeId } = await params;
  const resolution = await resolveDestinationByPlaceId(placeId);
  if (!resolution) return jsonError("Place not found", 404);

  return jsonOk({
    destination: resolution,
    meta: {
      ...GAIS_RESPONSE_META,
      ...resolution.meta,
    },
  });
}
