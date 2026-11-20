import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getTripEta } from "@/lib/transport/routing/traffic-aware-eta-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    return jsonOk(await getTripEta(user, tripId));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
