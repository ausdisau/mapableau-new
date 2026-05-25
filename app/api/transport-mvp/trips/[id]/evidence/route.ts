import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { assertDriverAssignedTrip } from "@/lib/transport-mvp/access-control";
import { recordTripEvidence } from "@/lib/transport-mvp/trip-evidence-service";
import { recordTripEvidenceSchema } from "@/lib/validation/transport-mvp";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("driver:trips");
  if (user instanceof Response) return user;
  const { id } = await params;

  try {
    await assertDriverAssignedTrip(id, user.id);
    const parsed = recordTripEvidenceSchema.parse(await req.json());
    const evidence = await recordTripEvidence({
      tripId: id,
      startedAt: new Date(parsed.startedAt),
      completedAt: new Date(parsed.completedAt),
      distanceKm: parsed.distanceKm,
      notes: parsed.notes,
      recordedById: user.id,
    });
    return jsonOk({ evidence });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("Forbidden", 403);
    }
    return jsonError("Evidence recording failed", 500);
  }
}
