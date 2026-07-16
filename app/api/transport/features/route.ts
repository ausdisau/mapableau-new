import { jsonOk } from "@/lib/api/response";
import { buildTransportFeaturesResponse } from "@/lib/transport/production-claims";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

/**
 * Public-readable transport capability claims.
 * No session required — used by the public /transport landing page.
 */
export async function GET() {
  try {
    return jsonOk(buildTransportFeaturesResponse());
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
