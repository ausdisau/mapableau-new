import { z } from "zod";

import {
  NAVIGATOR_CONSENT_PURPOSE,
  verifyPurposeConsent,
} from "@/lib/ai/navigator/consent-gate";
import { assertNavigatorCapability } from "@/lib/ai/navigator/gates";
import { consumePausedApproval } from "@/lib/ai/platform/agents-sdk";
import { assertNotPermanentlyProhibited } from "@/lib/ai/platform/agents-sdk/policy";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isNavigatorAgentsSdkEnabled,
  isNavigatorPilotEnabled,
} from "@/lib/config/navigator-pilot";

export const runtime = "nodejs";

const resumeSchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    approvalRecordId: z.string().min(1),
    decision: z.enum(["approve", "reject"]),
    capabilityKey: z
      .enum([
        "navigator.provider_search.interpret",
        "navigator.provider_search.reply",
        "navigator.provider_search.match",
      ])
      .default("navigator.provider_search.match"),
  })
  .strict();

/**
 * Resume a paused SDK approval. Re-checks capability + consent.
 * Never returns raw RunState to the client.
 */
export async function POST(req: Request) {
  if (!isNavigatorPilotEnabled() || !isNavigatorAgentsSdkEnabled()) {
    return jsonError("NAVIGATOR_AGENTS_SDK_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`navigator-pilot-agent-resume:${ip}`, {
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

  const parsed = resumeSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  const gate = await assertNavigatorCapability({
    capabilityKey: parsed.data.capabilityKey,
    tenantId: parsed.data.tenantId,
    participantId: parsed.data.participantId,
    actorUserId: user.id,
  });
  if (!gate.allowed) {
    return jsonError(`NAVIGATOR_GATE_DENIED:${gate.reason}`, 403);
  }

  const consent = await verifyPurposeConsent({
    tenantId: parsed.data.tenantId,
    participantId: parsed.data.participantId,
    actorUserId: user.id,
    scope: "profile.read",
    purpose: NAVIGATOR_CONSENT_PURPOSE,
    action: "match",
    delegationDomain: "navigator",
  });
  if (!consent.ok) {
    return jsonError(`NAVIGATOR_CONSENT_${consent.reason.toUpperCase()}`, 403);
  }

  const consumed = consumePausedApproval({
    approvalRecordId: parsed.data.approvalRecordId,
    tenantId: parsed.data.tenantId,
    participantId: parsed.data.participantId,
    decision: parsed.data.decision,
  });

  if (!consumed.ok) {
    return jsonError(consumed.reason ?? "APPROVAL_RESUME_FAILED", 400);
  }

  if (consumed.proposedAction) {
    try {
      assertNotPermanentlyProhibited(consumed.proposedAction);
    } catch (err) {
      const message = err instanceof Error ? err.message : "PROHIBITED";
      return jsonError(message, 400);
    }
  }

  // Intentionally omit runStateJson from the response.
  return jsonOk({
    status: parsed.data.decision === "approve" ? "approved" : "rejected",
    proposedAction: consumed.proposedAction ?? null,
    // Client must re-invoke agent-run for a fresh turn after approve when needed.
    resumed: parsed.data.decision === "approve",
  });
}
