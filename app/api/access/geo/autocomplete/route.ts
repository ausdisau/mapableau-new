import { accessGeoAutocomplete, isAccessGeocodingAvailable } from "@/lib/access-map/access-geocoding-service";
import { jsonError, jsonOk } from "@/lib/api/response";
import { accessGeoAutocompleteQuerySchema } from "@/types/access-geo";

export async function GET(req: Request) {
  if (!isAccessGeocodingAvailable()) {
    return jsonError("Address search is not configured", 503);
  }

  const url = new URL(req.url);
  const parsed = accessGeoAutocompleteQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    lat: url.searchParams.get("lat") ?? undefined,
    lng: url.searchParams.get("lng") ?? undefined,
  });

  if (!parsed.success) {
    return jsonError("Enter at least 2 characters to search addresses", 400);
  }

  const bias =
    parsed.data.lat != null && parsed.data.lng != null
      ? { latitude: parsed.data.lat, longitude: parsed.data.lng }
      : undefined;

  const suggestions = await accessGeoAutocomplete(parsed.data.q, bias);
  return jsonOk({ suggestions });
}
