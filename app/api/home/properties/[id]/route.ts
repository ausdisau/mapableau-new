import { jsonError, jsonOk } from "@/lib/api/response";
import { homeLivingConfig } from "@/lib/config/abilitypay-home-living";
import {
  getPublishedPropertyDetail,
  HomeDiscoveryDisabledError,
} from "@/lib/home-living/discovery/property-discovery-service";

type Params = Promise<{ id: string }>;

export async function GET(
  _request: Request,
  context: { params: Params },
) {
  if (!homeLivingConfig.enabled || !homeLivingConfig.discoveryEnabled) {
    return jsonError("Home discovery is disabled", 404);
  }
  const { id } = await context.params;
  try {
    const property = await getPublishedPropertyDetail(id);
    if (!property) return jsonError("Property not found", 404);
    return jsonOk({ property });
  } catch (error) {
    if (error instanceof HomeDiscoveryDisabledError) {
      return jsonError("Home discovery is disabled", 404);
    }
    return jsonError("Unable to load property", 500);
  }
}
