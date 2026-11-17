import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { setDriverLocationOptIn } from "@/lib/transport/privacy/driver-location-share";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { driverLocationOptInSchema } from "@/lib/validation/transport-trip-schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiPermission("transport:drive");
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const body = driverLocationOptInSchema.parse(await req.json());
    return jsonOk(await setDriverLocationOptIn(user, tripId, body.optedIn));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
