import {
  getActionProposal,
  rejectActionProposal,
  rejectActionProposalSchema,
} from "@/lib/ai/platform/actions";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isActionKernelOperational } from "@/lib/config/action-kernel";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ proposalId: string }> };

export async function POST(req: Request, context: RouteContext) {
  if (!isActionKernelOperational()) {
    return jsonError("ACTION_KERNEL_DISABLED", 403);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { proposalId } = await context.params;
  const existing = getActionProposal(proposalId);
  if (!existing) return jsonError("PROPOSAL_NOT_FOUND", 404);
  if (existing.participantId !== user.id) {
    return jsonError("FORBIDDEN", 403);
  }

  let body: unknown = {};
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = rejectActionProposalSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const proposal = rejectActionProposal({
      proposalId,
      actorId: user.id,
    });

    await createAuditEvent({
      actorUserId: user.id,
      participantId: user.id,
      action: "action.proposal.rejected",
      entityType: "MapAbleActionProposal",
      entityId: proposalId,
      metadata: { reason: parsed.data.reason ?? null },
    });

    return jsonOk({ proposal });
  } catch (err) {
    const message = err instanceof Error ? err.message : "REJECT_FAILED";
    return jsonError(message, 400);
  }
}
