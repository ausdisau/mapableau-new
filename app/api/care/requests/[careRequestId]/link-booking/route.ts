import { jsonError, jsonOk } from "@/lib/api/response";
import { linkBookingToCareRequest } from "@/lib/modules/care-facade";
import { requireCareApi } from "@/lib/modules/module-api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ careRequestId: string }> },
) {
  const { careRequestId } = await params;
  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
    select: { participantId: true, assignedOrganisationId: true },
  });
  if (!request) return jsonError("Not found", 404);

  const auth = await requireCareApi({
    participantId: request.participantId,
    organisationId: request.assignedOrganisationId,
  });
  if (auth instanceof Response) return auth;

  const updated = await linkBookingToCareRequest(careRequestId, auth.user.id);
  return jsonOk({ request: updated });
}
