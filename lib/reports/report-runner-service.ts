import { Prisma, type MapAbleUserRole } from "@prisma/client";

import { logAuditEvent } from "@/lib/audit/audit-service";
import { emitDomainEvent } from "@/lib/audit/domain-event-service";
import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";
import {
  deidentifyMetrics,
  stripSensitiveReportFields,
} from "@/lib/reports/deidentification-service";
import { getReportDefinitionByKey } from "@/lib/reports/report-definition-service";
import {
  applyLowCountSuppressionToRecord,
  suppressLowCount,
} from "@/lib/reports/low-count-suppression";
import {
  canRunReportCategory,
  requiresDeidentifiedView,
} from "@/lib/reports/report-access-policy";
import { getPermissionsForRole } from "@/lib/auth/permissions";

export interface RunReportOptions {
  reportKey: string;
  actorUserId: string;
  actorRole: MapAbleUserRole;
  organisationId?: string | null;
  participantId?: string | null;
  parameters?: Record<string, unknown>;
}

async function computeMetrics(
  reportKey: string,
  organisationId?: string | null,
  participantId?: string | null
): Promise<Record<string, unknown>> {
  const metrics: Record<string, unknown> = { reportKey, generatedAt: new Date().toISOString() };

  switch (reportKey) {
    case "participant_activity": {
      const pid = participantId;
      if (!pid) throw new Error("participantId required for participant_activity");
      metrics.bookings = suppressLowCount(
        await prisma.booking.count({ where: { participantId: pid } })
      );
      metrics.consents = suppressLowCount(
        await prisma.consentRecord.count({ where: { subjectUserId: pid } })
      );
      metrics.documents = suppressLowCount(
        await prisma.document.count({ where: { participantId: pid } })
      );
      break;
    }
    case "provider_operations": {
      const orgId = organisationId;
      if (!orgId) throw new Error("organisationId required for provider_operations");
      metrics.careShifts = suppressLowCount(
        await prisma.careShift.count({ where: { organisationId: orgId } })
      );
      metrics.workers = suppressLowCount(
        await prisma.workerProfile.count({ where: { organisationId: orgId } })
      );
      metrics.bookings = suppressLowCount(
        await prisma.booking.count({ where: { assignedOrganisationId: orgId } })
      );
      break;
    }
    case "care_delivery": {
      const orgFilter = organisationId
        ? { assignedOrganisationId: organisationId }
        : {};
      metrics.careRequestsCompleted = suppressLowCount(
        await prisma.careRequest.count({ where: { ...orgFilter, status: "completed" } })
      );
      metrics.shiftsCompleted = suppressLowCount(
        await prisma.careShift.count({ where: { ...orgFilter, status: "completed" } })
      );
      break;
    }
    case "transport_delivery": {
      const orgFilter = organisationId ? { operatorOrgId: organisationId } : {};
      metrics.transportCompleted = suppressLowCount(
        await prisma.transportBooking.count({ where: { ...orgFilter, status: "completed" } })
      );
      break;
    }
    case "employment_outcomes": {
      metrics.jobApplications = suppressLowCount(await prisma.jobApplication.count());
      metrics.jobsPosted = suppressLowCount(await prisma.job.count());
      break;
    }
    case "marketplace_activity": {
      metrics.providerProfiles = suppressLowCount(await prisma.providerProfile.count());
      break;
    }
    case "food_delivery": {
      metrics.placeholder = { value: 0, suppressed: false, note: "Food delivery module not yet configured" };
      break;
    }
    case "billing_finance": {
      const invFilter = organisationId ? { providerOrgId: organisationId } : {};
      metrics.draftInvoices = suppressLowCount(
        await prisma.invoice.count({ where: { ...invFilter, status: "draft" } })
      );
      metrics.paidInvoices = suppressLowCount(
        await prisma.invoice.count({ where: { ...invFilter, status: "paid" } })
      );
      break;
    }
    case "plan_manager_review": {
      metrics.invoicesForReview = suppressLowCount(
        await prisma.invoice.count({
          where: { status: { in: ["draft", "approved_for_invoicing"] } },
        })
      );
      break;
    }
    case "quality_safeguards": {
      metrics.openIncidents = suppressLowCount(
        await prisma.incidentReport.count({
          where: { status: { notIn: ["closed", "resolved"] } },
        })
      );
      metrics.criticalIncidents = suppressLowCount(
        await prisma.incidentReport.count({
          where: { severity: "critical", status: { notIn: ["closed", "resolved"] } },
        })
      );
      break;
    }
    case "privacy_security": {
      metrics.dataAccessEvents = suppressLowCount(await prisma.dataAccessLog.count());
      metrics.openBreaches = suppressLowCount(
        await prisma.privacyBreachRecord.count({
          where: { status: { notIn: ["closed"] } },
        })
      );
      break;
    }
    case "peer_community": {
      metrics.conversations = suppressLowCount(await prisma.conversation.count());
      break;
    }
    case "access_map": {
      metrics.places = suppressLowCount(await prisma.accessPlace.count());
      metrics.reports = suppressLowCount(await prisma.accessPlaceReport.count());
      break;
    }
    case "board_pack": {
      const participants = await prisma.user.count({ where: { primaryRole: "participant" } });
      const openCritical = await prisma.incidentReport.count({
        where: { severity: "critical", status: { notIn: ["closed", "resolved"] } },
      });
      metrics.participantsOnboarded = suppressLowCount(participants);
      metrics.openCriticalIncidents = suppressLowCount(openCritical);
      metrics.careCompleted = suppressLowCount(
        await prisma.careRequest.count({ where: { status: "completed" } })
      );
      metrics.disclaimer =
        "De-identified operational metrics. Not audited financial statements.";
      break;
    }
    default:
      throw new Error(`Unknown report key: ${reportKey}`);
  }

  return stripSensitiveReportFields(metrics);
}

export async function runReport(options: RunReportOptions) {
  if (!phase5Config.reportingEnabled) {
    return { disabled: true as const };
  }

  const definition = await getReportDefinitionByKey(options.reportKey);
  if (!definition || !definition.active) {
    throw new Error(`Report not found: ${options.reportKey}`);
  }

  const permissions = getPermissionsForRole(options.actorRole);
  if (
    !canRunReportCategory(options.actorRole, definition.category, permissions)
  ) {
    throw new Error("Insufficient permissions to run this report");
  }

  const run = await prisma.reportRun.create({
    data: {
      reportDefinitionId: definition.id,
      reportKey: options.reportKey,
      status: "running",
      parametersJson: (options.parameters ?? {}) as Prisma.InputJsonValue,
      organisationId: options.organisationId ?? null,
      actorUserId: options.actorUserId,
      startedAt: new Date(),
    },
  });

  try {
    let metrics = await computeMetrics(
      options.reportKey,
      options.organisationId,
      options.participantId
    );

    metrics = applyLowCountSuppressionToRecord(metrics);

    if (definition.deidentified || requiresDeidentifiedView(options.actorRole)) {
      metrics = await deidentifyMetrics(metrics);
    }

    const snapshot = await prisma.reportingSnapshot.create({
      data: {
        snapshotDate: new Date(),
        metricsJson: metrics as Prisma.InputJsonValue,
        createdById: options.actorUserId,
        reportRunId: run.id,
      },
    });

    const completed = await prisma.reportRun.update({
      where: { id: run.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        resultSummaryJson: {
          snapshotId: snapshot.id,
          metricKeys: Object.keys(metrics),
        } as Prisma.InputJsonValue,
      },
    });

    await logAuditEvent({
      actorUserId: options.actorUserId,
      actorRole: options.actorRole,
      organisationId: options.organisationId ?? undefined,
      action: "report.run",
      domain: "reporting",
      entityType: "ReportRun",
      entityId: run.id,
      participantId: options.participantId ?? undefined,
      riskLevel: "medium",
      outcome: "success",
      metadata: { reportKey: options.reportKey },
    });

    await emitDomainEvent({
      domain: "reporting",
      eventType: "report.completed",
      entityType: "ReportRun",
      entityId: run.id,
      organisationId: options.organisationId,
      actorUserId: options.actorUserId,
      summary: `Report ${options.reportKey} completed`,
      metadata: { reportKey: options.reportKey },
    });

    return { run: completed, snapshot, metrics };
  } catch (err) {
    await prisma.reportRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      },
    });
    throw err;
  }
}

export async function listReportRuns(filters: {
  reportKey?: string;
  organisationId?: string;
  limit?: number;
}) {
  return prisma.reportRun.findMany({
    where: {
      ...(filters.reportKey ? { reportKey: filters.reportKey } : {}),
      ...(filters.organisationId ? { organisationId: filters.organisationId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 20,
    include: {
      actorUser: { select: { name: true, email: true } },
      snapshots: { take: 1, orderBy: { createdAt: "desc" } },
    },
  });
}
