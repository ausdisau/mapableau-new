import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getSharedDriverLocation } from "@/lib/transport/privacy/driver-location-share";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    return jsonOk(await getSharedDriverLocation(user, tripId));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
