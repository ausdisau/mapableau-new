import {
  accessGeoResolvePlace,
  isAccessGeocodingAvailable,
} from "@/lib/access-map/access-geocoding-service";
import { jsonError, jsonOk } from "@/lib/api/response";
import { accessGeoPlaceIdQuerySchema } from "@/types/access-geo";

export async function GET(req: Request) {
  if (!isAccessGeocodingAvailable()) {
    return jsonError("Address search is not configured", 503);
  }

  const url = new URL(req.url);
  const parsed = accessGeoPlaceIdQuerySchema.safeParse({
    placeId: url.searchParams.get("placeId") ?? "",
  });

  if (!parsed.success) {
    return jsonError("placeId is required", 400);
  }

  const place = await accessGeoResolvePlace(parsed.data.placeId);
  if (!place) {
    return jsonError("Could not resolve that address", 404);
  }

  return jsonOk({ place });
}
