import type { MapAbleUserRole } from "@prisma/client";

import { requireApiSession } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { logDataAccess } from "@/lib/audit/data-access-log-service";
import { listReportRuns } from "@/lib/reports/report-runner-service";
import { hasPermission } from "@/lib/auth/permissions";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!hasPermission(user.primaryRole, "care:read:org")) {
    return jsonError("Forbidden", 403);
  }

  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  if (!organisationId) return jsonError("No organisation membership", 403);

  await logDataAccess({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    organisationId,
    entityType: "ReportRun",
    entityId: "list",
    sensitivityLevel: "internal",
    accessReason: "Provider reports list",
    result: "allowed",
  });

  const runs = await listReportRuns({ organisationId, limit: 20 });
  return jsonOk({ runs });
}
