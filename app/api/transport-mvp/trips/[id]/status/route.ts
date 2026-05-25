import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { assertDriverAssignedTrip } from "@/lib/transport-mvp/access-control";
import { updateTransportTripStatus } from "@/lib/transport-mvp/trip-lifecycle-service";
import { updateTripStatusSchema } from "@/lib/validation/transport-mvp";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("driver:trips");
  if (user instanceof Response) return user;
  const { id } = await params;

  try {
    await assertDriverAssignedTrip(id, user.id);
    const parsed = updateTripStatusSchema.parse(await req.json());
    const trip = await updateTransportTripStatus(
      id,
      parsed.status,
      user.id,
      parsed.message
    );
    return jsonOk({ trip });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("Forbidden", 403);
    }
    if (e instanceof Error && e.message === "EVIDENCE_REQUIRED") {
      return jsonError("Trip evidence required before completion", 400);
    }
    if (e instanceof Error) return jsonError(e.message, 400);
    return jsonError("Status update failed", 500);
  }
}
