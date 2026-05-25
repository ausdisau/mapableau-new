import type {
  FeatureFlagEnvironment,
  FeatureFlagRuleType,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import { isFailClosedKey } from "./feature-flag-policy";

export interface EvaluateContext {
  userId?: string;
  roles?: string[];
  organisationId?: string;
  region?: string;
  environment?: string;
}

export async function listFeatureFlags() {
  return prisma.featureFlag.findMany({
    orderBy: { key: "asc" },
    include: {
      rules: { orderBy: { priority: "desc" } },
      _count: { select: { events: true } },
    },
  });
}

export async function getFeatureFlagById(id: string) {
  return prisma.featureFlag.findUnique({
    where: { id },
    include: {
      rules: { orderBy: { priority: "desc" } },
      assignments: { include: { betaGroup: true } },
      events: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
}

export async function createFeatureFlag(params: {
  key: string;
  name: string;
  description?: string;
  enabled?: boolean;
  rolloutPercentage?: number;
  environment?: FeatureFlagEnvironment;
  moduleArea?: string;
  killSwitch?: boolean;
  createdById: string;
  rules?: { ruleType: FeatureFlagRuleType; ruleValue: string; priority?: number }[];
}) {
  const flag = await prisma.featureFlag.create({
    data: {
      key: params.key,
      name: params.name,
      description: params.description,
      enabled: params.enabled ?? false,
      rolloutPercentage: params.rolloutPercentage ?? 0,
      environment: params.environment ?? "all",
      moduleArea: params.moduleArea,
      killSwitch: params.killSwitch ?? false,
      createdById: params.createdById,
      updatedById: params.createdById,
      rules: params.rules?.length
        ? {
            create: params.rules.map((r) => ({
              ruleType: r.ruleType,
              ruleValue: r.ruleValue,
              priority: r.priority ?? 0,
            })),
          }
        : undefined,
    },
    include: { rules: true },
  });

  await recordFlagEvent({
    featureFlagId: flag.id,
    actorUserId: params.createdById,
    eventType: "created",
    afterJson: flag,
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "feature_flag.created",
    entityType: "FeatureFlag",
    entityId: flag.id,
    metadata: { key: flag.key },
  });

  return flag;
}

export async function updateFeatureFlag(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    enabled: boolean;
    rolloutPercentage: number;
    environment: FeatureFlagEnvironment;
    moduleArea: string;
    killSwitch: boolean;
  }>,
  actorUserId: string
) {
  const before = await prisma.featureFlag.findUnique({ where: { id } });
  const flag = await prisma.featureFlag.update({
    where: { id },
    data: { ...data, updatedById: actorUserId },
    include: { rules: true },
  });

  await recordFlagEvent({
    featureFlagId: id,
    actorUserId,
    eventType: "updated",
    beforeJson: before,
    afterJson: flag,
  });

  await createAuditEvent({
    actorUserId,
    action: "feature_flag.updated",
    entityType: "FeatureFlag",
    entityId: id,
    metadata: { key: flag.key },
  });

  return flag;
}

export async function toggleFeatureFlag(id: string, actorUserId: string) {
  const before = await prisma.featureFlag.findUnique({ where: { id } });
  if (!before) throw new Error("FLAG_NOT_FOUND");

  const flag = await prisma.featureFlag.update({
    where: { id },
    data: {
      enabled: !before.enabled,
      updatedById: actorUserId,
    },
  });

  await recordFlagEvent({
    featureFlagId: id,
    actorUserId,
    eventType: "toggled",
    beforeJson: { enabled: before.enabled },
    afterJson: { enabled: flag.enabled },
  });

  await createAuditEvent({
    actorUserId,
    action: "feature_flag.toggled",
    entityType: "FeatureFlag",
    entityId: id,
    metadata: { key: flag.key, enabled: flag.enabled },
  });

  return flag;
}

async function recordFlagEvent(params: {
  featureFlagId: string;
  actorUserId?: string;
  eventType: string;
  beforeJson?: unknown;
  afterJson?: unknown;
}) {
  await prisma.featureFlagEvent.create({
    data: {
      featureFlagId: params.featureFlagId,
      actorUserId: params.actorUserId,
      eventType: params.eventType,
      beforeJson: params.beforeJson as never,
      afterJson: params.afterJson as never,
    },
  });
}

function hashPercent(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 100;
}

export async function evaluateFeatureFlag(
  key: string,
  context: EvaluateContext
): Promise<boolean> {
  try {
    const flag = await prisma.featureFlag.findUnique({
      where: { key },
      include: {
        rules: { where: { enabled: true }, orderBy: { priority: "desc" } },
        assignments: true,
      },
    });

    if (!flag) {
      return isFailClosedKey(key) ? false : false;
    }

    if (flag.killSwitch) return false;
    if (!flag.enabled) return false;

    const env =
      context.environment ??
      process.env.NODE_ENV ??
      "development";
    if (
      flag.environment !== "all" &&
      flag.environment !== env
    ) {
      return false;
    }

    for (const rule of flag.rules) {
      switch (rule.ruleType) {
        case "role":
          if (context.roles?.includes(rule.ruleValue)) return true;
          break;
        case "user_id":
          if (context.userId === rule.ruleValue) return true;
          break;
        case "provider_id":
          if (context.organisationId === rule.ruleValue) return true;
          break;
        case "region":
          if (context.region === rule.ruleValue) return true;
          break;
        case "environment":
          if (env === rule.ruleValue) return true;
          break;
        case "beta_group": {
          if (!context.userId) break;
          const member = await prisma.betaGroupMember.findFirst({
            where: {
              userId: context.userId,
              betaGroup: { key: rule.ruleValue },
            },
          });
          if (member) return true;
          break;
        }
        case "percentage_rollout": {
          const pct = parseInt(rule.ruleValue, 10) || flag.rolloutPercentage;
          const bucket = hashPercent(`${key}:${context.userId ?? "anon"}`);
          if (bucket < pct) return true;
          break;
        }
        default:
          break;
      }
    }

    if (flag.assignments.length && context.userId) {
      const direct = flag.assignments.some((a) => a.userId === context.userId);
      if (direct) return true;
    }

    if (flag.rolloutPercentage >= 100) return true;
    if (flag.rolloutPercentage <= 0) return false;

    const bucket = hashPercent(`${key}:${context.userId ?? "anon"}`);
    return bucket < flag.rolloutPercentage;
  } catch {
    return isFailClosedKey(key) ? false : false;
  }
}

export async function evaluateMany(
  keys: string[],
  context: EvaluateContext
): Promise<Record<string, boolean>> {
  const out: Record<string, boolean> = {};
  for (const key of keys) {
    out[key] = await evaluateFeatureFlag(key, context);
  }
  return out;
}
