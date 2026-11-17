import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { createRouteEstimate } from "@/lib/transport/routing/route-estimate-service";
import { assertCanAccessTrip } from "@/lib/transport/transport-access-policy";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { routeEstimateSchema } from "@/lib/validation/transport-routing-schemas";

export async function POST(req: Request) {
  const user = await requireApiPermission("transport:read:org");
  if (user instanceof Response) return user;
  try {
    const body = routeEstimateSchema.parse(await req.json());
    if (body.tripId) {
      const trip = await prisma.transportTrip.findUnique({
        where: { id: body.tripId },
      });
      if (!trip) {
        throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
      }
      await assertCanAccessTrip(user, trip, "summary");
    }
    const result = await createRouteEstimate({
      input: {
        origin: body.origin,
        destination: body.destination,
        waypoints: body.waypoints,
        departAt: body.departAt,
        routeOptions: body.routeOptions,
        includeGeometry: body.includeGeometry,
      },
      tripId: body.tripId,
    });
    return jsonOk(result);
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
