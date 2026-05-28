import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { assertCanViewCareRequest } from "@/lib/care/access-control";
import { confirmQuotation } from "@/lib/care/service-quotation-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ quotationId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { quotationId } = await params;
  const quotation = await prisma.serviceQuotation.findUnique({
    where: { id: quotationId },
    include: {
      careRequest: {
        select: {
          id: true,
          participantId: true,
          assignedOrganisationId: true,
        },
      },
    },
  });
  if (!quotation) return jsonError("Not found", 404);

  try {
    await assertCanViewCareRequest(user, quotation.careRequest);
    const updated = await confirmQuotation({
      quotationId,
      actorUserId: user.id,
    });
    return jsonOk({ quotation: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "APPROVAL_REQUIRED") {
      return jsonError("Approval required before confirmation", 409);
    }
    return jsonError("Unable to confirm quotation", 500);
  }
}
