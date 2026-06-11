import type { MapAbleUserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { assertParticipantAccess } from "./access-service";
import { logCoordinateAudit } from "./audit-service";
import { createHumanReviewTask } from "./review-service";
import { COORDINATE_AUDIT_ACTIONS } from "./types";

export async function getBudgetForPlan(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  planId: string;
  participantId: string;
}) {
  await assertParticipantAccess(params);

  const plan = await prisma.coordinateNdisPlan.findUnique({
    where: { id: params.planId },
    include: { budgetCategories: true },
  });
  if (!plan || plan.participantId !== params.participantId) {
    throw new Error("NOT_FOUND");
  }

  const categories = plan.budgetCategories.map((cat) => {
    const used = cat.spentCents + cat.committedCents;
    const percent =
      cat.allocatedCents > 0
        ? Math.round((used / cat.allocatedCents) * 100)
        : 0;
    return { ...cat, usedCents: used, usedPercent: percent };
  });

  return { planId: plan.id, categories };
}

export async function upsertBudgetCategory(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  planId: string;
  participantId: string;
  supportCategory: string;
  allocatedCents: number;
  spentCents?: number;
  committedCents?: number;
  periodStart?: Date;
  periodEnd?: Date;
}) {
  await assertParticipantAccess(params);

  const plan = await prisma.coordinateNdisPlan.findUnique({
    where: { id: params.planId },
  });
  if (!plan || plan.participantId !== params.participantId) {
    throw new Error("NOT_FOUND");
  }

  const existing = await prisma.coordinateBudgetCategory.findFirst({
    where: { planId: params.planId, supportCategory: params.supportCategory },
  });

  const category = existing
    ? await prisma.coordinateBudgetCategory.update({
        where: { id: existing.id },
        data: {
          allocatedCents: params.allocatedCents,
          spentCents: params.spentCents ?? existing.spentCents,
          committedCents: params.committedCents ?? existing.committedCents,
          periodStart: params.periodStart,
          periodEnd: params.periodEnd,
        },
      })
    : await prisma.coordinateBudgetCategory.create({
        data: {
          planId: params.planId,
          supportCategory: params.supportCategory,
          allocatedCents: params.allocatedCents,
          spentCents: params.spentCents ?? 0,
          committedCents: params.committedCents ?? 0,
          periodStart: params.periodStart,
          periodEnd: params.periodEnd,
        },
      });

  const used = category.spentCents + category.committedCents;
  if (category.allocatedCents > 0 && used / category.allocatedCents > 0.85) {
    await prisma.coordinateRiskFlag.create({
      data: {
        participantId: params.participantId,
        planId: params.planId,
        code: "budget_near_limit",
        severity: used / category.allocatedCents > 0.95 ? "high" : "medium",
        summary: `${params.supportCategory} is nearing its budget limit`,
        reason: `${Math.round((used / category.allocatedCents) * 100)}% of allocated funds used or committed.`,
        confidence: 0.9,
        active: true,
      },
    });

    await createHumanReviewTask({
      participantId: params.participantId,
      taskType: "pricing",
      summary: `Review budget usage for ${params.supportCategory}`,
      payloadJson: { categoryId: category.id, usedPercent: Math.round((used / category.allocatedCents) * 100) },
      sourceEntityType: "CoordinateBudgetCategory",
      sourceEntityId: category.id,
      confidence: 0.9,
      reason: "Budget category exceeded review threshold.",
    });
  }

  await logCoordinateAudit({
    action: COORDINATE_AUDIT_ACTIONS.BUDGET_UPDATED,
    actorUserId: params.actorId,
    actorRole: params.actorRole,
    entityType: "CoordinateBudgetCategory",
    entityId: category.id,
    participantId: params.participantId,
  });

  return category;
}
