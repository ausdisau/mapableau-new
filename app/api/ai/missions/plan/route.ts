import { randomUUID } from "node:crypto";

import { z } from "zod";

import {
  formatMissionPlanForParticipant,
  missionRequestSchema,
  planMission,
} from "@/lib/ai/platform/missions";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAgenticNerveCentreEnabled } from "@/lib/config/agentic-nerve-centre";
import { createAuditEvent } from "@/lib/audit/audit-event-service";

export const runtime = "nodejs";

const planBodySchema = missionRequestSchema.extend({
  lifeIntentId: z.string().min(1).max(120).optional(),
});

/**
 * Create a participant-controlled mission plan. No autonomous execution.
 */
export async function POST(req: Request) {
  if (!isAgenticNerveCentreEnabled()) {
    return jsonError("AGENTIC_NERVE_CENTRE_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`ai-missions-plan:${ip}`, {
      windowMs: 60_000,
      max: 15,
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

  const parsed = planBodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const plan = planMission({
      missionId: randomUUID(),
      actorId: user.id,
      participantId: user.id,
      objective: parsed.data.objective,
      lifeIntentId: parsed.data.lifeIntentId,
      requestedDomains: parsed.data.requestedDomains,
      communicationPreferences: parsed.data.communicationPreferences,
      requestedUseOfAccessibilityProfile:
        parsed.data.requestedUseOfAccessibilityProfile,
      plainLanguage: parsed.data.plainLanguage,
      consentScopes: parsed.data.consentScopes,
      source: parsed.data.source,
      addedDomains: parsed.data.addedDomains,
      removedDomains: parsed.data.removedDomains,
      profileConsentGranted: parsed.data.profileConsentGranted,
    });

    await createAuditEvent({
      actorUserId: user.id,
      participantId: user.id,
      action: "mission.plan.created",
      entityType: "MissionPlan",
      entityId: plan.missionId,
      metadata: {
        status: plan.status,
        domains: plan.domains,
        traceId: plan.traceId,
      },
    });

    return jsonOk({
      plan,
      presentation: formatMissionPlanForParticipant(plan),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "MISSION_PLAN_FAILED";
    return jsonError(message, 400);
  }
}
