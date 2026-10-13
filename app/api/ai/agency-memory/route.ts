import {
  getAgencyMemorySnapshot,
  proposeMemory,
  proposeMemoryInputSchema,
} from "@/lib/ai/platform/agency-memory";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isAgencyMemoryEnabled } from "@/lib/config/agency-memory";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAgencyMemoryEnabled()) return jsonError("AGENCY_MEMORY_DISABLED", 403);
  const ip = getClientIp(req);
  if (!checkIpRateLimit(`ai-agency-memory-get:${ip}`, { windowMs: 60_000, max: 60 })) {
    return jsonError("RATE_LIMITED", 429);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    const snapshot = getAgencyMemorySnapshot({ participantId: user.id, tenantId: user.id });
    return jsonOk(snapshot);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "AGENCY_MEMORY_READ_FAILED", 400);
  }
}

export async function POST(req: Request) {
  if (!isAgencyMemoryEnabled()) return jsonError("AGENCY_MEMORY_DISABLED", 403);
  const ip = getClientIp(req);
  if (!checkIpRateLimit(`ai-agency-memory-post:${ip}`, { windowMs: 60_000, max: 30 })) {
    return jsonError("RATE_LIMITED", 429);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  let body: unknown;
  try { body = await parseJsonRequestBody(req); }
  catch (e) { const err = jsonBodyErrorResponse(e); return jsonError(err.message, err.status); }
  const parsed = proposeMemoryInputSchema.safeParse({
    ...(typeof body === "object" && body !== null ? body : {}),
    participantId: user.id, tenantId: user.id, actorId: user.id,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);
  if (parsed.data.source === "model_proposed" && parsed.data.autoConfirmIfParticipantExplicit) {
    return jsonError("AGENCY_MEMORY_INFERENCE_CANNOT_CONFIRM", 400);
  }
  try {
    const item = proposeMemory(parsed.data);
    await createAuditEvent({
      actorUserId: user.id, participantId: user.id,
      action: "agency_memory.proposed", entityType: "MapAbleAgencyMemoryItem", entityId: item.memoryId,
      metadata: { category: item.category, confirmationState: item.confirmationState, source: item.source },
    });
    return jsonOk({ item }, 201);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "AGENCY_MEMORY_PROPOSE_FAILED", 400);
  }
}
