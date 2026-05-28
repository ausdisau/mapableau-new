import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { assertCanViewCareRequest } from "@/lib/care/access-control";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ careRequestId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { careRequestId } = await params;
  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
    select: {
      id: true,
      participantId: true,
      assignedOrganisationId: true,
      serviceQuotations: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      serviceRequestApprovals: {
        orderBy: { decidedAt: "desc" },
      },
    },
  });

  if (!request) return jsonError("Not found", 404);

  try {
    await assertCanViewCareRequest(user, request);
  } catch {
    return jsonError("Forbidden", 403);
  }

  return jsonOk({
    latestQuotation: request.serviceQuotations[0] ?? null,
    quotations: request.serviceQuotations,
    approvals: request.serviceRequestApprovals,
  });
}
