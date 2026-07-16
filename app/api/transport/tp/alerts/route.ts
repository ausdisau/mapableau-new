import { requirePtReadAccess } from "@/lib/public-transport/require-pt-read";
import { jsonOk } from "@/lib/api/response";
import { getServiceAlerts } from "@/lib/tfnsw/trip-planner-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

export async function GET() {
  const user = await requirePtReadAccess();
  if (user instanceof Response) return user;
  try {
    const alerts = await getServiceAlerts();
    return jsonOk({ alerts });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
