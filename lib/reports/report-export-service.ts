import type { MapAbleUserRole, ReportExportFormat } from "@prisma/client";

import { logAuditEvent } from "@/lib/audit/audit-service";
import { logExportRequest } from "@/lib/data-governance/export-audit-service";
import { prisma } from "@/lib/prisma";
import { canExportReport } from "@/lib/reports/report-access-policy";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { exportReportSchema } from "@/lib/validation/reporting-audit";

export async function createReportExport(input: {
  reportRunId: string;
  format: ReportExportFormat;
  purpose: string;
  actorUserId: string;
  actorRole: MapAbleUserRole;
}) {
  const parsed = exportReportSchema.parse({
    reportRunId: input.reportRunId,
    format: input.format,
    purpose: input.purpose,
  });

  const permissions = getPermissionsForRole(input.actorRole);
  if (!canExportReport(input.actorRole, permissions)) {
    throw new Error("Insufficient permissions to export reports");
  }

  const run = await prisma.reportRun.findUnique({
    where: { id: parsed.reportRunId },
    include: { snapshots: { take: 1, orderBy: { createdAt: "desc" } } },
  });

  if (!run || run.status !== "completed") {
    throw new Error("Report run not found or not completed");
  }

  const snapshot = run.snapshots[0];
  const metrics = snapshot?.metricsJson as Record<string, unknown> | undefined;
  const rowCount = metrics ? Object.keys(metrics).length : 0;

  const exportRecord = await prisma.reportExport.create({
    data: {
      reportRunId: parsed.reportRunId,
      format: parsed.format,
      status: "completed",
      rowCount,
      fileName: `${run.reportKey}-${run.id}.${parsed.format}`,
      purpose: parsed.purpose,
      actorUserId: input.actorUserId,
    },
  });

  await prisma.reportExportEvent.create({
    data: {
      exportId: exportRecord.id,
      eventType: "export_requested",
      actorUserId: input.actorUserId,
      metadata: { purpose: parsed.purpose, format: parsed.format },
    },
  });

  await prisma.reportExportEvent.create({
    data: {
      exportId: exportRecord.id,
      eventType: "export_completed",
      actorUserId: input.actorUserId,
      metadata: { rowCount },
    },
  });

  await logExportRequest({
    requestedBy: input.actorUserId,
    purpose: parsed.purpose,
    rowCount,
  });

  await logAuditEvent({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    organisationId: run.organisationId ?? undefined,
    action: "report.export",
    domain: "reporting",
    entityType: "ReportExport",
    entityId: exportRecord.id,
    riskLevel: "high",
    outcome: "success",
    reason: parsed.purpose,
    metadata: {
      reportKey: run.reportKey,
      reportRunId: run.id,
      format: parsed.format,
      rowCount,
    },
  });

  return {
    export: exportRecord,
    data: metrics ?? {},
  };
}

export async function listReportExports(reportRunId: string) {
  return prisma.reportExport.findMany({
    where: { reportRunId },
    orderBy: { createdAt: "desc" },
    include: { events: { orderBy: { createdAt: "asc" } } },
  });
}
