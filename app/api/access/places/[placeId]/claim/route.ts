import { submitVenueClaim } from "@/lib/venue-access/venue-claim-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { submitVenueClaimSchema } from "@/lib/validation/access-venue-claim";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { placeId } = await params;
  const body = await req.json();
  const parsed = submitVenueClaimSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const claim = await submitVenueClaim({
    placeId,
    userId: user.id,
    businessName: parsed.data.businessName,
    evidenceNote: parsed.data.evidenceNote,
  });

  return jsonOk({ claim: { id: claim.id, status: claim.status } }, 201);
}
