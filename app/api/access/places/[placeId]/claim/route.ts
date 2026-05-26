import { submitVenueClaim } from "@/lib/venue-access/venue-claim-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { submitVenueClaimSchema } from "@/lib/validation/access-venue-claim";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ placeId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { placeId } = await params;
  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }
  const parsed = submitVenueClaimSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const claim = await submitVenueClaim({
      placeId,
      userId: user.id,
      businessName: parsed.data.businessName,
      evidenceNote: parsed.data.evidenceNote,
    });

    return jsonOk({ claim: { id: claim.id, status: claim.status } }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "VENUE_CLAIM_RATE_LIMIT") {
      return jsonError("Too many venue claims submitted recently", 429);
    }
    if (msg === "VENUE_CLAIM_ALREADY_SUBMITTED") {
      return jsonError("You already have an active claim for this venue", 409);
    }
    throw e;
  }
}
