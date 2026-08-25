import {
  executeActionSchema,
  executeApprovedAction,
  getActionProposal,
  recordMissionActionResult,
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

/**
 * Execute accepts ONLY proposalId, approvalId, nonce — never client payload.
 */
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

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = executeActionSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (parsed.data.proposalId !== proposalId) {
    return jsonError("PROPOSAL_ID_MISMATCH", 400);
  }

  try {
    const result = await executeApprovedAction(
      {
        proposalId: parsed.data.proposalId,
        approvalId: parsed.data.approvalId,
        nonce: parsed.data.nonce,
      },
      {
        participantId: user.id,
        actorId: user.id,
        user,
      },
    );

    recordMissionActionResult(existing.missionId, result);

    await createAuditEvent({
      actorUserId: user.id,
      participantId: user.id,
      action: "action.proposal.executed",
      entityType: result.entityType ?? "MapAbleActionResult",
      entityId: result.entityId ?? result.resultId,
      metadata: {
        proposalId: result.proposalId,
        approvalId: result.approvalId,
        actionKey: result.actionKey,
        status: result.status,
        payloadHash: result.payloadHash,
        missionFeedback: result.missionFeedback,
      },
    });

    return jsonOk({ result }, result.status === "completed" ? 201 : 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "EXECUTE_FAILED";
    const status =
      message === "NONCE_ALREADY_CONSUMED" || message === "IDEMPOTENCY_CONFLICT"
        ? 409
        : 400;
    return jsonError(message, status);
  }
}
