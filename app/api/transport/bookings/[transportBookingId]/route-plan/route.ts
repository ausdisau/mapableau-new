import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isDynamicRoutingEnabled } from "@/lib/config/dynamic-routing";
import { phase5Config } from "@/lib/config/phase5";
import { planFromTransportBooking } from "@/lib/route-optimisation/route-plan-service";
import { assertTransportBookingRouteAccess } from "@/lib/transport/transport-route-access";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!isDynamicRoutingEnabled() && !phase5Config.routeOptimisationEnabled) {
    return jsonError("Route planning is disabled", 503);
  }

  const { transportBookingId } = await params;
  const access = await assertTransportBookingRouteAccess(
    user,
    transportBookingId,
  );
  if (!access.ok) {
    return jsonError("Not found", access.status === 404 ? 404 : 403);
  }

  try {
    const result = await planFromTransportBooking(
      transportBookingId,
      user.id,
    );
    if ("skipped" in result && result.skipped) {
      return jsonError(result.message ?? "Skipped", 503);
    }
    return jsonOk(result, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    return jsonError("Route plan failed", 500);
  }
}
