import type { MapAbleUserRole, ReportExportFormat } from "@prisma/client";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createReportExport } from "@/lib/reports/report-export-service";
import { exportReportSchema } from "@/lib/validation/reporting-audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ reportKey: string }> }
) {
  const user = await requireApiPermission("report:export");
  if (user instanceof Response) return user;

  const { reportKey: _reportKey } = await params;
  const body = await req.json();
  const parsed = exportReportSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await createReportExport({
      reportRunId: parsed.data.reportRunId,
      format: parsed.data.format as ReportExportFormat,
      purpose: parsed.data.purpose,
      actorUserId: user.id,
      actorRole: user.primaryRole as MapAbleUserRole,
    });
    return jsonOk(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Export failed", 400);
  }
}
