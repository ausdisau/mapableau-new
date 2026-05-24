import { jsonError, jsonOk } from "@/lib/api/response";
import { getCareRequestBundle } from "@/lib/care/care-bundle-service";
import { requireCareApi } from "@/lib/modules/module-api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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

  const bundle = await getCareRequestBundle(careRequestId);
  return jsonOk(bundle);
}
