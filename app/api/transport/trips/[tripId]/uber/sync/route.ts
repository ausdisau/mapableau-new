import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { syncUberGuestTripStatus } from "@/lib/uber/transport-bridge";
import { handleUberRouteError } from "@/lib/uber/route-handler";
import { uberRequestIdQuerySchema } from "@/lib/validation/uber-schemas";
import { zodErrorResponse } from "@/lib/api/response";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const url = new URL(req.url);
    const parsed = uberRequestIdQuerySchema.safeParse({
      requestId: url.searchParams.get("requestId"),
    });
    if (!parsed.success) return zodErrorResponse(parsed.error);
    return jsonOk(
      await syncUberGuestTripStatus(user, tripId, parsed.data.requestId)
    );
  } catch (e) {
    return handleUberRouteError(e);
  }
}
