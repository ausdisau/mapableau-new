import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { cancelUberGuestTripForTransportTrip } from "@/lib/uber/transport-bridge";
import { handleUberRouteError } from "@/lib/uber/route-handler";
import { uberRequestIdQuerySchema } from "@/lib/validation/uber-schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const body = (await req.json().catch(() => ({}))) as { requestId?: string };
    const parsed = uberRequestIdQuerySchema.safeParse({
      requestId: body.requestId,
    });
    if (!parsed.success) return zodErrorResponse(parsed.error);
    return jsonOk(
      await cancelUberGuestTripForTransportTrip(
        user,
        tripId,
        parsed.data.requestId
      )
    );
  } catch (e) {
    return handleUberRouteError(e);
  }
}
