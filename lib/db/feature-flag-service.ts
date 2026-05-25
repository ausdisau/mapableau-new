import type { FeatureFlagRuleOperator } from "@prisma/client";

import { getDbClient } from "@/lib/db/db-client";
import type { FeatureFlagEvaluationContext, FeatureFlagKey } from "@/types/core";

function ruleMatches(
  operator: FeatureFlagRuleOperator,
  ruleValue: unknown,
  contextValue: unknown
): boolean {
  if (contextValue === undefined) return false;
  switch (operator) {
    case "equals":
      return ruleValue === contextValue;
    case "in":
      return Array.isArray(ruleValue) && ruleValue.includes(contextValue);
    case "not_in":
      return Array.isArray(ruleValue) && !ruleValue.includes(contextValue);
    default:
      return false;
  }
}

export async function upsertFeatureFlag(params: {
  key: FeatureFlagKey | string;
  description?: string;
  enabled: boolean;
}) {
  return getDbClient().featureFlag.upsert({
    where: { key: params.key },
    create: {
      key: params.key,
      description: params.description,
      enabled: params.enabled,
    },
    update: {
      description: params.description,
      enabled: params.enabled,
    },
  });
}

export async function evaluateFeatureFlag(
  key: FeatureFlagKey | string,
  context: FeatureFlagEvaluationContext = {}
): Promise<boolean> {
  const flag = await getDbClient().featureFlag.findUnique({
    where: { key },
    include: { rules: true },
  });

  if (!flag) return false;
  if (!flag.enabled) {
    await recordFeatureFlagEvaluation(flag.id, false, context);
    return false;
  }

  if (flag.rules.length === 0) {
    await recordFeatureFlagEvaluation(flag.id, true, context);
    return true;
  }

  const contextRecord: Record<string, unknown> = {
    profileId: context.profileId,
    role: context.role,
    organisationId: context.organisationId,
    environment: context.environment ?? process.env.NODE_ENV,
  };

  const allMatch = flag.rules.every((rule) =>
    ruleMatches(
      rule.operator,
      rule.value,
      contextRecord[rule.attribute]
    )
  );

  await recordFeatureFlagEvaluation(flag.id, allMatch, context);
  return allMatch;
}

async function recordFeatureFlagEvaluation(
  featureFlagId: string,
  evaluated: boolean,
  context: FeatureFlagEvaluationContext
) {
  await getDbClient().featureFlagEvent.create({
    data: {
      featureFlagId,
      actorUserId: context.profileId,
      evaluated,
      context: context as object,
    },
  });
}
