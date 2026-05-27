import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { logDataAccess } from "@/lib/audit/data-access-log-service";
import { listReportRuns } from "@/lib/reports/report-runner-service";
import { hasPermission } from "@/lib/auth/permissions";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (
    !hasPermission(user.primaryRole, "provider_quality:read") &&
    user.primaryRole !== "quality_lead"
  ) {
    return jsonError("Forbidden", 403);
  }

  await logDataAccess({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    entityType: "ReportRun",
    entityId: "quality_safeguards",
    sensitivityLevel: "confidential",
    accessReason: "Quality reports view",
    result: "allowed",
  });

  const runs = await listReportRuns({ reportKey: "quality_safeguards", limit: 10 });
  return jsonOk({ runs });
}
