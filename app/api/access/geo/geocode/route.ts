import {
  accessGeoGeocodeAddress,
  isAccessGeocodingAvailable,
} from "@/lib/access-map/access-geocoding-service";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { accessGeoGeocodeBodySchema } from "@/types/access-geo";

export async function POST(req: Request) {
  if (!isAccessGeocodingAvailable()) {
    return jsonError("Geocoding is not configured", 503);
  }

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = accessGeoGeocodeBodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const place = await accessGeoGeocodeAddress(parsed.data.queryText);
  if (!place) {
    return jsonError("No matching address found", 404);
  }

  return jsonOk({ place });
}
