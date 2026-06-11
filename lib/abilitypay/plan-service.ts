import type { MapAbleUserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  createBudgetCategorySchema,
  createFundingPeriodSchema,
  createPlanSchema,
  updatePlanSchema,
} from "@/types/abilitypay";
import type { z } from "zod";

import { logAbilityPayEvent } from "./audit";

export async function listPlansForUser(
  userId: string,
  role: MapAbleUserRole
) {
  if (role === "plan_manager") {
    const rels = await prisma.planManagerRelationship.findMany({
      where: { planManagerId: userId, status: "active" },
    });
    const participantIds = rels.map((r) => r.participantId);
    return prisma.abilityPayParticipantPlan.findMany({
      where: { participantId: { in: participantIds } },
      include: { categories: true, fundingPeriods: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  return prisma.abilityPayParticipantPlan.findMany({
    where: { participantId: userId },
    include: { categories: true, fundingPeriods: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getPlanById(planId: string) {
  return prisma.abilityPayParticipantPlan.findUnique({
    where: { id: planId },
    include: {
      categories: { orderBy: { sortOrder: "asc" } },
      fundingPeriods: { orderBy: { startAt: "asc" } },
      participant: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function createPlan(
  userId: string,
  input: z.infer<typeof createPlanSchema>
) {
  const participantId = input.participantId ?? userId;
  const plan = await prisma.abilityPayParticipantPlan.create({
    data: {
      participantId,
      createdById: userId,
      title: input.title,
      ndisNumber: input.ndisNumber,
      planStartAt: input.planStartAt ? new Date(input.planStartAt) : undefined,
      planEndAt: input.planEndAt ? new Date(input.planEndAt) : undefined,
      totalBudgetCents: input.totalBudgetCents ?? 0,
      notes: input.notes,
      status: "draft",
    },
    include: { categories: true, fundingPeriods: true },
  });

  await logAbilityPayEvent({
    action: "abilitypay.plan.created",
    entityType: "AbilityPayParticipantPlan",
    entityId: plan.id,
    actorUserId: userId,
    participantId,
    metadata: { title: plan.title },
  });

  return plan;
}

export async function updatePlan(
  planId: string,
  userId: string,
  input: z.infer<typeof updatePlanSchema>
) {
  const plan = await prisma.abilityPayParticipantPlan.update({
    where: { id: planId },
    data: {
      title: input.title,
      ndisNumber: input.ndisNumber,
      status: input.status,
      planStartAt:
        input.planStartAt === null
          ? null
          : input.planStartAt
            ? new Date(input.planStartAt)
            : undefined,
      planEndAt:
        input.planEndAt === null
          ? null
          : input.planEndAt
            ? new Date(input.planEndAt)
            : undefined,
      totalBudgetCents: input.totalBudgetCents,
      notes: input.notes,
    },
    include: { categories: true, fundingPeriods: true },
  });

  await logAbilityPayEvent({
    action: "abilitypay.plan.updated",
    entityType: "AbilityPayParticipantPlan",
    entityId: plan.id,
    actorUserId: userId,
    participantId: plan.participantId,
  });

  return plan;
}

export async function addBudgetCategory(
  planId: string,
  userId: string,
  input: z.infer<typeof createBudgetCategorySchema>
) {
  const count = await prisma.abilityPayBudgetCategory.count({
    where: { planId },
  });

  const category = await prisma.abilityPayBudgetCategory.create({
    data: {
      planId,
      name: input.name,
      categoryCode: input.categoryCode,
      allocatedCents: input.allocatedCents,
      description: input.description,
      sortOrder: count,
    },
  });

  const plan = await prisma.abilityPayParticipantPlan.findUnique({
    where: { id: planId },
  });

  await logAbilityPayEvent({
    action: "abilitypay.budget.created",
    entityType: "AbilityPayBudgetCategory",
    entityId: category.id,
    actorUserId: userId,
    participantId: plan?.participantId,
    metadata: { name: category.name, allocatedCents: category.allocatedCents },
  });

  return category;
}

export async function addFundingPeriod(
  planId: string,
  userId: string,
  input: z.infer<typeof createFundingPeriodSchema>
) {
  const period = await prisma.abilityPayFundingPeriod.create({
    data: {
      planId,
      label: input.label,
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
    },
  });

  const plan = await prisma.abilityPayParticipantPlan.findUnique({
    where: { id: planId },
  });

  await logAbilityPayEvent({
    action: "abilitypay.funding_period.created",
    entityType: "AbilityPayFundingPeriod",
    entityId: period.id,
    actorUserId: userId,
    participantId: plan?.participantId,
  });

  return period;
}

export async function recalcBudgetSpent(planId: string) {
  const categories = await prisma.abilityPayBudgetCategory.findMany({
    where: { planId },
  });

  for (const category of categories) {
    const lines = await prisma.abilityPayInvoiceLineItem.findMany({
      where: {
        budgetCategoryId: category.id,
        invoice: { status: "approved", planId },
      },
    });
    const spent = lines.reduce((sum, line) => sum + line.totalCents, 0);
    await prisma.abilityPayBudgetCategory.update({
      where: { id: category.id },
      data: { spentCents: spent },
    });
  }
}

export async function getPlanWalletSummary(planId: string) {
  const plan = await getPlanById(planId);
  if (!plan) return null;

  const allocated = plan.categories.reduce(
    (sum, c) => sum + c.allocatedCents,
    0
  );
  const spent = plan.categories.reduce((sum, c) => sum + c.spentCents, 0);
  const remaining = allocated - spent;

  return {
    plan,
    allocatedCents: allocated,
    spentCents: spent,
    remainingCents: remaining,
    totalBudgetCents: plan.totalBudgetCents,
  };
}
