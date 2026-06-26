import { createTripFromAccessPlace } from "@/lib/access-transport/access-transport-orchestrator";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { planAccessibleTripSchema } from "@/types/access-transport";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = planAccessibleTripSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await createTripFromAccessPlace({
      user,
      placeId: parsed.data.placeId,
      pickupAddress: parsed.data.pickupAddress,
      pickupSuburb: parsed.data.pickupSuburb,
      scheduledStart: parsed.data.scheduledStart,
      prefillFromProfile: parsed.data.prefillFromProfile,
    });

    return jsonOk(
      {
        trip: result.tripResult,
        destinationProfile: result.destinationProfile,
        journeyConfidence: result.journeyConfidence,
      },
      201
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "PLACE_NOT_FOUND") return jsonError("Place not found", 404);
    throw e;
  }
}
