import { z } from "zod";

import {
  NAVIGATOR_CONSENT_PURPOSE,
  verifyPurposeConsent,
} from "@/lib/ai/navigator/consent-gate";
import { assertNavigatorCapability } from "@/lib/ai/navigator/gates";
import {
  appendIrisSessionTurn,
  loadIrisMemoryForTurn,
} from "@/lib/ai/memory/iris-agent-memory";
import {
  buildAgentsSdkContext,
  runMapAbleAgentsSdk,
} from "@/lib/ai/platform/agents-sdk";
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

const agentRunBodySchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    sessionId: z.string().min(1).max(120).optional(),
    message: z.string().min(1).max(4000),
    aiOptedOut: z.boolean().optional(),
    capabilityKey: z
      .enum([
        "navigator.provider_search.interpret",
        "navigator.provider_search.reply",
        "navigator.provider_search.match",
      ])
      .default("navigator.provider_search.match"),
    purpose: z.string().min(1).max(200).default("navigator_provider_search"),
  })
  .strict();

/**
 * Internal/server Agents SDK bridge for the Navigator pilot.
 * Returns final text or opaque approval id — never raw RunState.
 * Flag: MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED (requires pilot master flag).
 */
export async function POST(req: Request) {
  if (!isNavigatorPilotEnabled() || !isNavigatorAgentsSdkEnabled()) {
    return jsonError("NAVIGATOR_AGENTS_SDK_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`navigator-pilot-agent-run:${ip}`, {
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

  const parsed = agentRunBodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  if (parsed.data.aiOptedOut === true) {
    return jsonOk({
      status: "blocked",
      reason: "MAPABLE_AGENT_AI_OPTED_OUT",
      text: null,
      approvalRecordId: null,
    });
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

  const memory = await loadIrisMemoryForTurn({
    tenantId: parsed.data.tenantId,
    participantId: parsed.data.participantId,
    sessionId: parsed.data.sessionId,
    query: parsed.data.message,
    actorId: user.id,
  });

  const context = buildAgentsSdkContext({
    tenantId: parsed.data.tenantId,
    participantId: parsed.data.participantId,
    actorUserId: user.id,
    capabilityKey: parsed.data.capabilityKey,
    purpose: parsed.data.purpose,
    sessionId: parsed.data.sessionId ?? memory.sessionId,
    aiOptedOut: false,
    memorySnippets: memory.snippets,
  });

  try {
    const outcome = await runMapAbleAgentsSdk({
      context,
      userMessage: parsed.data.message,
    });

    if (outcome.status === "completed") {
      void appendIrisSessionTurn({
        tenantId: parsed.data.tenantId,
        participantId: parsed.data.participantId,
        sessionId: parsed.data.sessionId,
        actorId: user.id,
        userText: parsed.data.message,
        assistantText: outcome.text,
      });
      return jsonOk({
        status: "completed",
        text: outcome.text,
        toolsCalled: outcome.toolsCalled,
        agentRunId: outcome.agentRunId,
        approvalRecordId: null,
        irisMemoryUsed: memory.snippets.length > 0,
      });
    }

    if (outcome.status === "needs_approval") {
      return jsonOk({
        status: "needs_approval",
        text: null,
        approvalRecordId: outcome.approvalRecordId,
        proposedAction: outcome.proposedAction,
        summary: outcome.summary,
        // Never include RunState
      });
    }

    return jsonOk({
      status: "blocked",
      reason: outcome.reason,
      text: null,
      approvalRecordId: null,
      toolsCalled: outcome.toolsCalled,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "NAVIGATOR_AGENT_RUN_ERROR";
    return jsonError(message, 400);
  }
}
