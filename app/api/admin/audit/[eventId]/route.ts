import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getAuditLogById } from "@/lib/audit/audit-service";
import { logDataAccess } from "@/lib/audit/data-access-log-service";
import { hasPermission } from "@/lib/auth/permissions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const user = await requireApiPermission("audit:read");
  if (user instanceof Response) return user;

  const { eventId } = await params;

  if (!hasPermission(user.primaryRole, "audit:read:privileged")) {
    return jsonError("Privileged audit access required", 403);
  }

  const event = await getAuditLogById(eventId);
  if (!event) return jsonError("Not found", 404);

  await logDataAccess({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    entityType: "AuditLog",
    entityId: eventId,
    participantId: event.participantId ?? undefined,
    sensitivityLevel: "restricted",
    accessReason: "Raw audit log detail view",
    result: "allowed",
  });

  return jsonOk({ event });
}
