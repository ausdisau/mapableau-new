import {
  createActionProposal,
  createActionProposalInputSchema,
} from "@/lib/ai/platform/actions";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isActionKernelOperational } from "@/lib/config/action-kernel";

export const runtime = "nodejs";

/**
 * Create a governed action proposal. Does not execute.
 */
export async function POST(req: Request) {
  if (!isActionKernelOperational()) {
    return jsonError("ACTION_KERNEL_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`ai-actions-propose:${ip}`, {
      windowMs: 60_000,
      max: 20,
    })
  ) {
    return jsonError("RATE_LIMITED", 429);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = createActionProposalInputSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const proposal = createActionProposal({
      missionId: parsed.data.missionId,
      traceId: parsed.data.traceId,
      actionKey: parsed.data.actionKey,
      participantId: user.id,
      actorId: user.id,
      payload: parsed.data.payload,
      informationToShare: parsed.data.informationToShare,
      purpose: parsed.data.purpose,
      consentScopes: parsed.data.consentScopes,
      missionProposalId: parsed.data.missionProposalId ?? null,
      expiresInHours: parsed.data.expiresInHours,
    });

    await createAuditEvent({
      actorUserId: user.id,
      participantId: user.id,
      action: "action.proposal.created",
      entityType: "MapAbleActionProposal",
      entityId: proposal.proposalId,
      metadata: {
        actionKey: proposal.actionKey,
        missionId: proposal.missionId,
        payloadHash: proposal.payloadHash,
        traceId: proposal.traceId,
      },
    });

    return jsonOk({ proposal }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "PROPOSAL_FAILED";
    return jsonError(message, 400);
  }
}
