import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { dispatchUberGuestTripForTransportTrip } from "@/lib/uber/transport-bridge";
import { handleUberRouteError } from "@/lib/uber/route-handler";
import { uberDispatchSchema } from "@/lib/validation/uber-schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const parsed = uberDispatchSchema.safeParse(
      await req.json().catch(() => ({}))
    );
    if (!parsed.success) return zodErrorResponse(parsed.error);
    return jsonOk(
      await dispatchUberGuestTripForTransportTrip(user, tripId, {
        productId: parsed.data.productId,
        fareId: parsed.data.fareId,
      })
    );
  } catch (e) {
    return handleUberRouteError(e);
  }
}
