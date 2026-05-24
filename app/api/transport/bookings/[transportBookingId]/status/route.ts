import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { canAccessTransportBooking } from "@/lib/transport-osm/access-control";
import { transitionTripStatus } from "@/lib/transport-osm/trip-status-service";
import { transitionTripStatusSchema } from "@/lib/validation/transport-osm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> }
) {
  const session = await requireApiSession();
  if (session instanceof Response) return session;
  const { transportBookingId } = await params;

  const allowed = await canAccessTransportBooking(session, transportBookingId);
  if (!allowed) return jsonError("Forbidden", 403);

  try {
    const body = transitionTripStatusSchema.parse(await req.json());
    const updated = await transitionTripStatus({
      transportBookingId,
      toStatus: body.toStatus,
      actorUserId: session.id,
      reason: body.reason,
    });
    return jsonOk({ booking: updated });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "INVALID_TRANSITION") {
      return jsonError("Invalid status transition", 400);
    }
    return jsonError("Update failed", 500);
  }
}
