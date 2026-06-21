import type { Prisma, UsageEventCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type RecordUsageEventParams = {
  category: UsageEventCategory;
  eventType: string;
  userId?: string;
  organisationId?: string;
  developerAppId?: string;
  entityType?: string;
  entityId?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
};

export async function recordUsageEvent(params: RecordUsageEventParams) {
  return prisma.usageEvent.create({
    data: {
      category: params.category,
      eventType: params.eventType,
      userId: params.userId,
      organisationId: params.organisationId,
      developerAppId: params.developerAppId,
      entityType: params.entityType,
      entityId: params.entityId,
      quantity: params.quantity ?? 1,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function countUsageEvents(params: {
  category: UsageEventCategory;
  eventType?: string;
  userId?: string;
  organisationId?: string;
  developerAppId?: string;
  since?: Date;
}) {
  return prisma.usageEvent.count({
    where: {
      category: params.category,
      eventType: params.eventType,
      userId: params.userId,
      organisationId: params.organisationId,
      developerAppId: params.developerAppId,
      createdAt: params.since ? { gte: params.since } : undefined,
    },
  });
}

export async function countUsageInPeriod(params: {
  category: UsageEventCategory;
  eventType: string;
  userId?: string;
  organisationId?: string;
  periodStart: Date;
  periodEnd?: Date;
}) {
  return prisma.usageEvent.count({
    where: {
      category: params.category,
      eventType: params.eventType,
      userId: params.userId,
      organisationId: params.organisationId,
      createdAt: {
        gte: params.periodStart,
        lte: params.periodEnd,
      },
    },
  });
}
