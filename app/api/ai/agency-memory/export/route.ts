import { exportAgencyMemory } from "@/lib/ai/platform/agency-memory";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isAgencyMemoryEnabled } from "@/lib/config/agency-memory";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAgencyMemoryEnabled()) return jsonError("AGENCY_MEMORY_DISABLED", 403);
  const ip = getClientIp(req);
  if (!checkIpRateLimit(`ai-agency-memory-export:${ip}`, { windowMs: 60_000, max: 10 })) {
    return jsonError("RATE_LIMITED", 429);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    const bundle = exportAgencyMemory({ participantId: user.id, tenantId: user.id });
    await createAuditEvent({
      actorUserId: user.id, participantId: user.id,
      action: "agency_memory.exported", entityType: "AgencyMemoryExport", entityId: user.id,
      metadata: { itemCount: bundle.items.length },
    });
    return jsonOk(bundle);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "AGENCY_MEMORY_EXPORT_FAILED", 400);
  }
}
