import type { MapAbleUserRole } from "@prisma/client";

import { requireApiSession, requireApiPermission } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { logDataAccess } from "@/lib/audit/data-access-log-service";
import { getReportDefinitionByKey } from "@/lib/reports/report-definition-service";
import {
  canRunReportCategory,
} from "@/lib/reports/report-access-policy";
import { runReport } from "@/lib/reports/report-runner-service";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { runReportSchema } from "@/lib/validation/reporting-audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ reportKey: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { reportKey } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = runReportSchema.safeParse({ ...body, reportKey });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const definition = await getReportDefinitionByKey(reportKey);
  if (!definition) return jsonError("Report not found", 404);

  const permissions = getPermissionsForRole(user.primaryRole);
  if (!canRunReportCategory(user.primaryRole, definition.category, permissions)) {
    return jsonError("Forbidden", 403);
  }

  let organisationId = parsed.data.organisationId ?? undefined;
  if (
    user.primaryRole === "provider_admin" ||
    user.primaryRole === "transport_operator"
  ) {
    const orgIds = await getUserOrganisationIds(user.id);
    organisationId = organisationId ?? orgIds[0];
  }

  await logDataAccess({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    entityType: "ReportDefinition",
    entityId: definition.id,
    organisationId,
    sensitivityLevel: definition.deidentified ? "internal" : "confidential",
    accessReason: "Report run requested",
    result: "allowed",
  });

  try {
    const result = await runReport({
      reportKey,
      actorUserId: user.id,
      actorRole: user.primaryRole as MapAbleUserRole,
      organisationId,
      participantId:
        user.primaryRole === "participant" ? user.id : undefined,
      parameters: parsed.data.parameters,
    });

    if ("disabled" in result && result.disabled) {
      return jsonError("Reporting is disabled", 503);
    }

    return jsonOk(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Run failed", 400);
  }
}
