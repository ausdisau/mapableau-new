import { revokeMemory, revokeMemoryInputSchema } from "@/lib/ai/platform/agency-memory";
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

export async function POST(req: Request) {
  if (!isAgencyMemoryEnabled()) return jsonError("AGENCY_MEMORY_DISABLED", 403);
  const ip = getClientIp(req);
  if (!checkIpRateLimit(`ai-agency-memory-revoke:${ip}`, { windowMs: 60_000, max: 30 })) {
    return jsonError("RATE_LIMITED", 429);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  let body: unknown;
  try { body = await parseJsonRequestBody(req); }
  catch (e) { const err = jsonBodyErrorResponse(e); return jsonError(err.message, err.status); }
  const parsed = revokeMemoryInputSchema.safeParse({
    ...(typeof body === "object" && body !== null ? body : {}),
    participantId: user.id, tenantId: user.id, actorId: user.id,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const item = revokeMemory(parsed.data);
    await createAuditEvent({
      actorUserId: user.id, participantId: user.id,
      action: "agency_memory.revoked", entityType: "MapAbleAgencyMemoryItem", entityId: item.memoryId,
      metadata: { category: item.category, version: item.version },
    });
    return jsonOk({ item });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "AGENCY_MEMORY_REVOKE_FAILED", 400);
  }
}
