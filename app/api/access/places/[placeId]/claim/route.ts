import { submitVenueClaim } from "@/lib/venue-access/venue-claim-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { placeId } = await params;
  const body = await req.json();

  const claim = await submitVenueClaim({
    placeId,
    userId: user.id,
    businessName: body.businessName,
    evidenceNote: body.evidenceNote,
  });

  return jsonOk({ claim: { id: claim.id, status: claim.status } }, 201);
}
