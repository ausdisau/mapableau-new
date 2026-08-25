import {
  approveActionProposal,
  approveActionProposalSchema,
  getActionProposal,
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
 * Bind participant approval to the exact proposal payloadHash + nonce.
 */
export async function POST(req: Request, context: RouteContext) {
  if (!isActionKernelOperational()) {
    return jsonError("ACTION_KERNEL_DISABLED", 403);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { proposalId } = await context.params;
  const proposal = getActionProposal(proposalId);
  if (!proposal) return jsonError("PROPOSAL_NOT_FOUND", 404);
  if (proposal.participantId !== user.id) {
    return jsonError("FORBIDDEN", 403);
  }

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = approveActionProposalSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const binding = approveActionProposal({
      proposalId,
      actorId: user.id,
      actorType: "participant",
      consentScopes: parsed.data.consentScopes,
      confirmedInformationToShare: parsed.data.confirmedInformationToShare,
    });

    await createAuditEvent({
      actorUserId: user.id,
      participantId: user.id,
      action: "action.proposal.approved",
      entityType: "MapAbleActionProposal",
      entityId: proposalId,
      metadata: {
        approvalId: binding.approvalId,
        payloadHash: binding.payloadHash,
        noncePresent: Boolean(binding.nonce),
      },
    });

    return jsonOk({
      approval: {
        approvalId: binding.approvalId,
        proposalId: binding.proposalId,
        payloadHash: binding.payloadHash,
        nonce: binding.nonce,
        expiresAt: binding.expiresAt,
        approvedInformationToShareHash: binding.approvedInformationToShareHash,
      },
      confirmationText:
        "You have approved this action for the exact details shown. Nothing else will change without a new review.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "APPROVAL_FAILED";
    return jsonError(message, 400);
  }
}
