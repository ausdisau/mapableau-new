import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { assertCanViewCareRequest } from "@/lib/care/access-control";
import { rejectQuotation } from "@/lib/care/service-quotation-service";
import { prisma } from "@/lib/prisma";
import { rejectQuotationSchema } from "@/lib/validation/care";

export async function POST(
  req: Request,
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

    const parsed = rejectQuotationSchema.parse(await req.json());
    const updated = await rejectQuotation({
      quotationId,
      actorUserId: user.id,
      reason: parsed.reason,
    });
    return jsonOk({ quotation: updated });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return jsonError("Unable to reject quotation", 500);
  }
}
