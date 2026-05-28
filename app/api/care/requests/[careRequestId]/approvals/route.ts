import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { assertCanViewCareRequest } from "@/lib/care/access-control";
import { onServiceRequestApprovalRecorded } from "@/lib/care/service-request-worker";
import { prisma } from "@/lib/prisma";
import { recordServiceRequestApprovalSchema } from "@/lib/validation/care";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ careRequestId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { careRequestId } = await params;

  const existing = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
    select: {
      id: true,
      participantId: true,
      assignedOrganisationId: true,
    },
  });
  if (!existing) return jsonError("Not found", 404);

  try {
    await assertCanViewCareRequest(user, existing);

    const parsed = recordServiceRequestApprovalSchema.parse(await req.json());

    const result = await onServiceRequestApprovalRecorded({
      careRequestId,
      actorUserId: user.id,
      actorRole: user.primaryRole,
      decision: parsed.decision,
      reason: parsed.reason,
      metadata: parsed.metadata,
    });

    return jsonOk(result, 201);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    if (error instanceof Error && error.message.includes("access denied")) {
      return jsonError("Forbidden", 403);
    }
    return jsonError("Unable to record approval", 500);
  }
}
