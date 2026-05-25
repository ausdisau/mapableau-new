import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { disputeTransportTrip } from "@/lib/transport-mvp/participant-confirmation-service";
import { disputeTripSchema } from "@/lib/validation/transport-mvp";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("transport:manage:self");
  if (user instanceof Response) return user;
  const { id } = await params;

  try {
    const parsed = disputeTripSchema.parse(await req.json());
    const trip = await disputeTransportTrip(id, user.id, parsed.reason);
    return jsonOk({ trip });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Trip not found", 404);
    }
    return jsonError("Dispute failed", 400);
  }
}
