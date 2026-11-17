import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { grantTripDriverLocationConsent } from "@/lib/transport/privacy/driver-location-share";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { tripLocationConsentSchema } from "@/lib/validation/transport-trip-schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const body = tripLocationConsentSchema.parse(await req.json());
    return jsonOk(await grantTripDriverLocationConsent(user, tripId, body.granted));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
