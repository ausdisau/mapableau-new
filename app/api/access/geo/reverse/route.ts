import {
  accessGeoReverseGeocode,
  isAccessGeocodingAvailable,
} from "@/lib/access-map/access-geocoding-service";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { accessGeoReverseBodySchema } from "@/types/access-geo";

export async function POST(req: Request) {
  if (!isAccessGeocodingAvailable()) {
    return jsonError("Reverse geocoding is not configured", 503);
  }

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = accessGeoReverseBodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const place = await accessGeoReverseGeocode(
    parsed.data.latitude,
    parsed.data.longitude
  );
  if (!place) {
    return jsonError("No address found for this location", 404);
  }

  return jsonOk({ place });
}
