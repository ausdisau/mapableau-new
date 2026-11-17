import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { refreshTripEta } from "@/lib/transport/routing/traffic-aware-eta-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { tripEtaRefreshSchema } from "@/lib/validation/transport-trip-schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const body = tripEtaRefreshSchema.parse(await req.json().catch(() => ({})));
    return jsonOk(
      await refreshTripEta(user, tripId, { reroute: body.reroute })
    );
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
