import { ZodError } from "zod";

import {
  requireApiPermission,
  requireApiSession,
} from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { canAccessDispute } from "@/lib/disputes/access";
import {
  getDisputeById,
  requestProviderResponse,
  updateDisputeStatus,
} from "@/lib/disputes/dispute-service";
import { updateDisputeStatusSchema } from "@/lib/validation/disputes";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;
  const dispute = await getDisputeById(id);
  if (!dispute) return jsonError("Not found", 404);

  const isAdmin = isAdminRole(user.primaryRole);
  const isParticipant = dispute.participantId === user.id;

  if (!isAdmin && !isParticipant && !(await canAccessDispute(user, dispute))) {
    return jsonError("Forbidden", 403);
  }

  try {
    const body = updateDisputeStatusSchema.parse(await req.json());

    if (!isAdmin && !isParticipant) {
      return jsonError("Only admins or the participant can change status", 403);
    }

    if (body.status === "awaiting_provider_response" && isAdmin) {
      const updated = await requestProviderResponse(id, user.id);
      return jsonOk({ dispute: updated });
    }

    const updated = await updateDisputeStatus({
      disputeId: id,
      status: body.status,
      actorUserId: user.id,
      resolutionSummary: body.resolutionSummary,
      assignedAdminId: isAdmin ? body.assignedAdminId : undefined,
    });
    return jsonOk({ dispute: updated });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not update status", 500);
  }
}
