import { isAccessGeocodingAvailable } from "@/lib/access-map/access-geocoding-service";
import { jsonOk } from "@/lib/api/response";

export async function GET() {
  return jsonOk({
    enabled: isAccessGeocodingAvailable(),
    provider: "amazon-location",
  });
}
