import type { MapAbleUserRole } from "@prisma/client";

import { requireApiSession } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { listAuditLogs } from "@/lib/audit/audit-service";
import { listDataAccessLogs } from "@/lib/audit/data-access-log-service";
import { hasPermission } from "@/lib/auth/permissions";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!hasPermission(user.primaryRole, "audit:read:org")) {
    return jsonError("Forbidden", 403);
  }

  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  if (!organisationId) return jsonError("No organisation membership", 403);

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "audit";

  if (type === "data_access") {
    const logs = await listDataAccessLogs({ organisationId, limit: 100 });
    return jsonOk({ logs });
  }

  const events = await listAuditLogs({ organisationId, limit: 100 });
  return jsonOk({ events });
}
