import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase6Config } from "@/lib/config/phase6";
import {
  PUBLIC_LAUNCH_CHECKLIST,
  getLaunchChecklistMeta,
} from "@/lib/launch-readiness/public-launch-checklist";
import { runLaunchAutoCheck } from "@/lib/launch-readiness/launch-auto-checks";
import { prisma } from "@/lib/prisma";
import type { LaunchReadinessStatus } from "@prisma/client";

export const LAUNCH_READINESS_STATUSES: LaunchReadinessStatus[] = [
  "not_started",
  "in_progress",
  "blocked",
  "ready",
  "waived",
];

export async function getLaunchReadinessSummary() {
  const items = await prisma.launchReadinessItem.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });
  const ready = items.filter(
    (i) => i.status === "ready" || i.status === "waived"
  ).length;
  const expectedTotal = PUBLIC_LAUNCH_CHECKLIST.length;
  const catalogByCode = new Map(
    PUBLIC_LAUNCH_CHECKLIST.map((c) => [c.code, c])
  );

  const itemsWithMeta = items.map((item) => {
    const catalog = catalogByCode.get(item.code);
    return {
      ...item,
      gapSeverity: catalog?.gapSeverity ?? "medium",
      runbookPath: catalog?.runbookPath ?? getLaunchChecklistMeta(item.code).runbookPath,
      platformGapCode: `launch.${item.code}`,
    };
  });

  const incompleteBlockers = itemsWithMeta
    .filter((i) => i.status !== "ready" && i.status !== "waived")
    .sort((a, b) => severityRank(a.gapSeverity) - severityRank(b.gapSeverity))
    .slice(0, 5);

  return {
    total: items.length,
    ready,
    percent: items.length ? Math.round((ready / items.length) * 100) : 0,
    items: itemsWithMeta,
    productionReady:
      ready === items.length &&
      items.length > 0 &&
      items.length >= expectedTotal,
    expectedChecklistTotal: expectedTotal,
    checklistComplete: items.length >= expectedTotal,
    nextBlockers: incompleteBlockers.map((i) => ({
      code: i.code,
      title: i.title,
      status: i.status,
      gapSeverity: i.gapSeverity,
      runbookPath: i.runbookPath,
    })),
  };
}

function severityRank(severity: string): number {
  switch (severity) {
    case "critical":
      return 0;
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
      return 3;
    default:
      return 4;
  }
}

export async function updateLaunchReadinessItem(input: {
  code: string;
  status: LaunchReadinessStatus;
  actorUserId: string;
  notes?: string | null;
  evidenceDocumentId?: string | null;
}) {
  if (!LAUNCH_READINESS_STATUSES.includes(input.status)) {
    throw new Error("INVALID_STATUS");
  }

  const existing = await prisma.launchReadinessItem.findUnique({
    where: { code: input.code },
  });
  if (!existing) throw new Error("NOT_FOUND");

  const completed =
    input.status === "ready" || input.status === "waived"
      ? { completedAt: new Date(), completedById: input.actorUserId }
      : { completedAt: null, completedById: null };

  const item = await prisma.launchReadinessItem.update({
    where: { code: input.code },
    data: {
      status: input.status,
      notes: input.notes ?? undefined,
      evidenceDocumentId: input.evidenceDocumentId ?? undefined,
      ...completed,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "launch_readiness.item_updated",
    entityType: "LaunchReadinessItem",
    entityId: item.id,
    metadata: {
      code: input.code,
      status: input.status,
      previousStatus: existing.status,
    },
  });

  return item;
}

/** @deprecated Prefer updateLaunchReadinessItem with code */
export async function completeLaunchItem(
  itemId: string,
  actorUserId: string,
  evidenceDocumentId?: string
) {
  const existing = await prisma.launchReadinessItem.findUnique({
    where: { id: itemId },
  });
  if (!existing) throw new Error("NOT_FOUND");
  return updateLaunchReadinessItem({
    code: existing.code,
    status: "ready",
    actorUserId,
    evidenceDocumentId,
  });
}

export async function runLaunchAutoCheckForCode(code: string) {
  return runLaunchAutoCheck(code);
}

export async function seedDefaultLaunchItems() {
  if (!phase6Config.mobileProductionReadinessEnabled) return;
  for (let i = 0; i < PUBLIC_LAUNCH_CHECKLIST.length; i++) {
    const item = PUBLIC_LAUNCH_CHECKLIST[i];
    await prisma.launchReadinessItem.upsert({
      where: { code: item.code },
      create: {
        code: item.code,
        category: item.category,
        title: item.title,
        description: item.description,
        sortOrder: i,
      },
      update: {
        category: item.category,
        title: item.title,
        description: item.description,
        sortOrder: i,
      },
    });
  }
}
