import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listAuditLogs } from "@/lib/audit/audit-service";
import { logDataAccess } from "@/lib/audit/data-access-log-service";

export async function GET(req: Request) {
  const user = await requireApiPermission("audit:read");
  if (user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") ?? undefined;
  const domain = searchParams.get("domain") ?? undefined;
  const organisationId = searchParams.get("organisationId") ?? undefined;
  const participantId = searchParams.get("participantId") ?? undefined;

  await logDataAccess({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    entityType: "AuditLog",
    entityId: "list",
    sensitivityLevel: "confidential",
    accessReason: "Admin audit explorer",
    result: "allowed",
  });

  const events = await listAuditLogs({
    action,
    domain,
    organisationId,
    participantId,
    limit: 100,
  });

  return jsonOk({ events });
}
