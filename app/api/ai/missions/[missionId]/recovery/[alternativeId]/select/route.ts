import { z } from "zod";

import { formatMissionPlanForParticipant, getMissionPlan } from "@/lib/ai/platform/missions";
import { selectRecoveryAlternative, formatRecoveryForParticipant, getRecoverySnapshot } from "@/lib/ai/platform/recovery";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonBodyErrorResponse, parseJsonRequestBody } from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isAdaptiveRecoveryEnabled } from "@/lib/config/adaptive-recovery";
import { isAgenticNerveCentreEnabled } from "@/lib/config/agentic-nerve-centre";

export const runtime = "nodejs";
const selectBodySchema = z.object({ consentScopes: z.array(z.string()).optional() }).strict();
type RouteContext = { params: Promise<{ missionId: string; alternativeId: string }> };

export async function POST(req: Request, context: RouteContext) {
  if (!isAgenticNerveCentreEnabled()) return jsonError("AGENTIC_NERVE_CENTRE_DISABLED", 403);
  if (!isAdaptiveRecoveryEnabled()) return jsonError("ADAPTIVE_RECOVERY_DISABLED", 403);
  const ip = getClientIp(req);
  if (!checkIpRateLimit(`ai-missions-recovery-select:${ip}`, { windowMs: 60_000, max: 15 })) return jsonError("RATE_LIMITED", 429);
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { missionId, alternativeId } = await context.params;
  if (!getMissionPlan(missionId)) return jsonError("MISSION_NOT_FOUND", 404);
  let body: unknown;
  try { body = await parseJsonRequestBody(req); } catch (e) { const err = jsonBodyErrorResponse(e); return jsonError(err.message, err.status); }
  const parsed = selectBodySchema.safeParse(body ?? {});
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const result = selectRecoveryAlternative({
      missionId, alternativeId, actorId: user.id, participantId: user.id, consentScopes: parsed.data.consentScopes,
    });
    await createAuditEvent({
      actorUserId: user.id, participantId: user.id, action: "mission.recovery.alternative_selected",
      entityType: "MissionRecovery", entityId: missionId,
      metadata: { alternativeId, label: result.selectedAlternative.label, kernelProposalIds: result.kernelProposalIds,
        note: "Candidate plan updated; Action Kernel proposals prepared — not executed" },
    });
    const snapshot = getRecoverySnapshot(missionId);
    return jsonOk({
      state: result.state, selectedAlternative: result.selectedAlternative, candidatePlan: result.candidatePlan,
      kernelProposalIds: result.kernelProposalIds,
      planPresentation: formatMissionPlanForParticipant(result.candidatePlan),
      recoveryPresentation: snapshot.state ? formatRecoveryForParticipant({ state: snapshot.state, activity: snapshot.activity }) : null,
    });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "SELECT_ALTERNATIVE_FAILED", 400);
  }
}
