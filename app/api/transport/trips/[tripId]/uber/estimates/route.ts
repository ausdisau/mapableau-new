import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getUberEstimatesForTransportTrip } from "@/lib/uber/transport-bridge";
import { handleUberRouteError } from "@/lib/uber/route-handler";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    return jsonOk(await getUberEstimatesForTransportTrip(user, tripId));
  } catch (e) {
    return handleUberRouteError(e);
  }
}
