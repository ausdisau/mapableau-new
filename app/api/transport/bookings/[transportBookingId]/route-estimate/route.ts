import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isDynamicRoutingEnabled } from "@/lib/config/dynamic-routing";
import { computeDynamicRouteEstimate } from "@/lib/routing/dynamic-route-service";
import { assertTransportBookingRouteAccess } from "@/lib/transport/transport-route-access";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!isDynamicRoutingEnabled()) {
    return jsonError("Dynamic routing is disabled", 503);
  }

  const { transportBookingId } = await params;
  const access = await assertTransportBookingRouteAccess(
    user,
    transportBookingId,
  );
  if (!access.ok) {
    return jsonError("Not found", access.status === 404 ? 404 : 403);
  }

  const estimate = await computeDynamicRouteEstimate(transportBookingId);
  return jsonOk({ estimate, provider: "haversine" });
}
