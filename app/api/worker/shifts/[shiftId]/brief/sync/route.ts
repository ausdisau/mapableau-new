import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { validateBriefSyncPayload } from "@/lib/mobile/offline-brief-cache";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { shiftId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = validateBriefSyncPayload(body);
  if (!parsed.valid || parsed.shiftId !== shiftId) {
    return jsonError("Invalid sync payload", 400);
  }

  await createAuditEvent({
    actorUserId: user.id,
    action: "worker_brief.offline_sync",
    entityType: "CareShift",
    entityId: shiftId,
    metadata: { cachedAt: parsed.cachedAt },
  });

  return jsonOk({
    acknowledged: true,
    shiftId,
    serverTime: new Date().toISOString(),
  });
}
