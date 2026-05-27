import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { logDataAccess } from "@/lib/audit/data-access-log-service";
import { listReportRuns } from "@/lib/reports/report-runner-service";
import { hasPermission } from "@/lib/auth/permissions";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const allowed =
    hasPermission(user.primaryRole, "invoice:read:any") ||
    hasPermission(user.primaryRole, "reconciliation:manage") ||
    user.primaryRole === "finance_lead" ||
    user.primaryRole === "plan_manager";

  if (!allowed) return jsonError("Forbidden", 403);

  await logDataAccess({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    entityType: "ReportRun",
    entityId: "billing_finance",
    sensitivityLevel: "confidential",
    accessReason: "Finance reports view",
    result: "allowed",
  });

  const runs = await listReportRuns({ reportKey: "billing_finance", limit: 10 });
  return jsonOk({ runs });
}
