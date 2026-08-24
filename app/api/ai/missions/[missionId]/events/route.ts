import { z } from "zod";

import { getMissionPlan } from "@/lib/ai/platform/missions";
import { ingestMissionEvent, MISSION_EVENT_TYPES, EVENT_SOURCES } from "@/lib/ai/platform/recovery";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonBodyErrorResponse, parseJsonRequestBody } from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isAdaptiveRecoveryEnabled } from "@/lib/config/adaptive-recovery";
import { isAgenticNerveCentreEnabled } from "@/lib/config/agentic-nerve-centre";

export const runtime = "nodejs";
const eventBodySchema = z.object({
  type: z.enum(MISSION_EVENT_TYPES), source: z.enum(EVENT_SOURCES),
  reportedBy: z.string().optional(), systemRecordId: z.string().optional(),
  verificationState: z.enum(["verified","supported","partial","uncertain","unknown"]).optional(),
  limitations: z.array(z.string()).optional(), occurredAt: z.string().optional(),
  affectedNodeIds: z.array(z.string()).optional(), payload: z.record(z.string(), z.unknown()).optional(),
  idempotencyKey: z.string().optional(),
});
type RouteContext = { params: Promise<{ missionId: string }> };

export async function POST(req: Request, context: RouteContext) {
  if (!isAgenticNerveCentreEnabled()) return jsonError("AGENTIC_NERVE_CENTRE_DISABLED", 403);
  if (!isAdaptiveRecoveryEnabled()) return jsonError("ADAPTIVE_RECOVERY_DISABLED", 403);
  const ip = getClientIp(req);
  if (!checkIpRateLimit(`ai-missions-events:${ip}`, { windowMs: 60_000, max: 30 })) return jsonError("RATE_LIMITED", 429);
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { missionId } = await context.params;
  if (!getMissionPlan(missionId)) return jsonError("MISSION_NOT_FOUND", 404);
  let body: unknown;
  try { body = await parseJsonRequestBody(req); } catch (e) { const err = jsonBodyErrorResponse(e); return jsonError(err.message, err.status); }
  const parsed = eventBodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const result = ingestMissionEvent({
      missionId, type: parsed.data.type, source: parsed.data.source,
      reportedBy: parsed.data.reportedBy ?? user.id, systemRecordId: parsed.data.systemRecordId,
      verificationState: parsed.data.verificationState, limitations: parsed.data.limitations,
      occurredAt: parsed.data.occurredAt, affectedNodeIds: parsed.data.affectedNodeIds,
      payload: parsed.data.payload, idempotencyKey: parsed.data.idempotencyKey,
    });
    await createAuditEvent({
      actorUserId: user.id, participantId: user.id, action: "mission.recovery.event_ingested",
      entityType: "MissionEvent", entityId: result.event.eventId,
      metadata: { missionId, type: result.event.type, source: result.event.source, duplicate: result.duplicate, autoReassessed: result.autoReassessed },
    });
    return jsonOk({ event: result.event, duplicate: result.duplicate, trigger: result.trigger, autoReassessed: result.autoReassessed });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "EVENT_INGEST_FAILED", 400);
  }
}
