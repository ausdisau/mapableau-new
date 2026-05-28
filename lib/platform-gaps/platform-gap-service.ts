import type { PlatformGapResolutionStatus as PrismaResolutionStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { PLATFORM_GAP_CATALOG } from "@/lib/platform-gaps/gap-catalog";
import { runPlatformGapDetector } from "@/lib/platform-gaps/detectors";
import type {
  PlatformGapAnalysisSummary,
  PlatformGapCategory,
  PlatformGapDetectedStatus,
  PlatformGapResolutionStatus,
  PlatformGapRow,
  PlatformGapSeverity,
} from "@/lib/platform-gaps/types";
import { prisma } from "@/lib/prisma";

const CATEGORIES: PlatformGapCategory[] = [
  "product",
  "integration",
  "tenancy_auth",
  "launch_ops",
  "compliance_ndis",
];

const SEVERITIES: PlatformGapSeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
  "informational",
];

/** Maps auto-detected status to default effective resolution when no manual override exists. */
export function mapDetectedToEffectiveStatus(
  detected: PlatformGapDetectedStatus
): PlatformGapResolutionStatus {
  switch (detected) {
    case "met":
      return "mitigated";
    case "partial":
      return "in_progress";
    case "not_applicable":
      return "closed";
    case "open":
    default:
      return "open";
  }
}

function isOpenEffective(status: PlatformGapResolutionStatus): boolean {
  return status === "open" || status === "in_progress";
}

export async function getPlatformGapAnalysisSummary(): Promise<PlatformGapAnalysisSummary> {
  const evaluatedAt = new Date();
  const overrides = await prisma.platformGapOverride.findMany();
  const overrideByCode = new Map(overrides.map((o) => [o.code, o]));

  const gaps: PlatformGapRow[] = [];

  for (const entry of PLATFORM_GAP_CATALOG) {
    const detection = await runPlatformGapDetector(entry);
    const override = overrideByCode.get(entry.code);
    const effectiveStatus: PlatformGapResolutionStatus = override
      ? (override.status as PlatformGapResolutionStatus)
      : mapDetectedToEffectiveStatus(detection.detectedStatus);

    gaps.push({
      code: entry.code,
      category: entry.category,
      title: entry.title,
      description: entry.description,
      severity: entry.severity,
      baseline: entry.baseline,
      evidenceLinks: entry.evidenceLinks,
      detectedStatus: detection.detectedStatus,
      detectedSummary: detection.detectedSummary,
      effectiveStatus,
      overrideStatus: override
        ? (override.status as PlatformGapResolutionStatus)
        : null,
      overrideNotes: override?.notes ?? null,
      lastEvaluatedAt: evaluatedAt.toISOString(),
    });
  }

  gaps.sort((a, b) => {
    const severityOrder = SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity);
    if (severityOrder !== 0) return severityOrder;
    return a.title.localeCompare(b.title);
  });

  const byCategory = Object.fromEntries(
    CATEGORIES.map((cat) => {
      const inCat = gaps.filter((g) => g.category === cat);
      return [
        cat,
        {
          total: inCat.length,
          open: inCat.filter((g) => isOpenEffective(g.effectiveStatus)).length,
        },
      ];
    })
  ) as PlatformGapAnalysisSummary["byCategory"];

  const bySeverity = Object.fromEntries(
    SEVERITIES.map((sev) => [sev, gaps.filter((g) => g.severity === sev).length])
  ) as PlatformGapAnalysisSummary["bySeverity"];

  return {
    lastEvaluatedAt: evaluatedAt.toISOString(),
    total: gaps.length,
    openCount: gaps.filter((g) => isOpenEffective(g.effectiveStatus)).length,
    byCategory,
    bySeverity,
    gaps,
  };
}

export async function upsertPlatformGapOverride(params: {
  code: string;
  status: PlatformGapResolutionStatus;
  notes?: string | null;
  actorUserId: string;
}) {
  const entry = PLATFORM_GAP_CATALOG.find((e) => e.code === params.code);
  if (!entry) {
    throw new Error(`Unknown platform gap code: ${params.code}`);
  }

  const row = await prisma.platformGapOverride.upsert({
    where: { code: params.code },
    create: {
      code: params.code,
      status: params.status as PrismaResolutionStatus,
      notes: params.notes ?? null,
      updatedById: params.actorUserId,
    },
    update: {
      status: params.status as PrismaResolutionStatus,
      notes: params.notes ?? null,
      updatedById: params.actorUserId,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "platform_gap.override_updated",
    entityType: "PlatformGapOverride",
    entityId: row.id,
    metadata: {
      code: params.code,
      status: params.status,
    },
  });

  return row;
}
