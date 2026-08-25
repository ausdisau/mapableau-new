import { z } from "zod";

import {
  formatMissionPlanForParticipant,
  missionReplanSchema,
  replanMission,
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

type RouteContext = { params: Promise<{ missionId: string }> };

export async function POST(req: Request, context: RouteContext) {
  if (!isAgenticNerveCentreEnabled()) {
    return jsonError("AGENTIC_NERVE_CENTRE_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`ai-missions-replan:${ip}`, {
      windowMs: 60_000,
      max: 15,
    })
  ) {
    return jsonError("RATE_LIMITED", 429);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { missionId } = await context.params;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = missionReplanSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const plan = replanMission({
      missionId,
      actorId: user.id,
      participantId: user.id,
      objective: parsed.data.objective,
      addedDomains: parsed.data.addedDomains,
      removedDomains: parsed.data.removedDomains,
      rejectedRecommendationIds: parsed.data.rejectedRecommendationIds,
      requestedUseOfAccessibilityProfile:
        parsed.data.requestedUseOfAccessibilityProfile,
      profileConsentGranted: parsed.data.profileConsentGranted,
      selectNonAiPath: parsed.data.selectNonAiPath,
    });

    await createAuditEvent({
      actorUserId: user.id,
      participantId: user.id,
      action: "mission.plan.replanned",
      entityType: "MissionPlan",
      entityId: plan.missionId,
      metadata: {
        status: plan.status,
        rejected: parsed.data.rejectedRecommendationIds ?? [],
      },
    });

    return jsonOk({
      plan,
      presentation: formatMissionPlanForParticipant(plan),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "MISSION_REPLAN_FAILED";
    return jsonError(message, 400);
  }
}
