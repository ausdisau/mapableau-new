/**
 * Resolve Access Intelligence entitlements from BillingSubscription (test mode).
 * Only active/trialing subscriptions map to paid AI plans.
 * Does not create Stripe prices — requires env price IDs when checking out.
 */

import type { BillingSubscriptionPlanCode } from "@prisma/client";

import {
  checkEntitlement,
  type AccessIntelligenceFeature,
  type AccessIntelligencePlan,
  type EntitlementDecision,
  resolveAccessIntelligencePlan,
} from "@/lib/access-intelligence/entitlements";
import { prisma } from "@/lib/prisma";

const ACTIVE_STATUSES = ["active", "trialing"] as const;

export async function loadActiveAiBillingPlanCodes(
  userId: string,
): Promise<BillingSubscriptionPlanCode[]> {
  const rows = await prisma.billingSubscription.findMany({
    where: {
      userId,
      status: { in: [...ACTIVE_STATUSES] },
      planCode: {
        in: [
          "ai_verify_starter",
          "ai_verify_operations",
          "ai_verify_portfolio",
          "ai_learning_organisation",
          "ai_enterprise",
        ],
      },
    },
    select: { planCode: true },
  });
  return rows.map((r) => r.planCode);
}

export async function resolveAccessIntelligencePlanForUser(input: {
  userId: string;
  roles: string[];
  organisationId?: string | null;
  planOverride?: AccessIntelligencePlan | null;
}): Promise<{ plan: AccessIntelligencePlan; billingPlanCodes: BillingSubscriptionPlanCode[] }> {
  let billingPlanCodes: BillingSubscriptionPlanCode[] = [];
  try {
    billingPlanCodes = await loadActiveAiBillingPlanCodes(input.userId);
  } catch {
    // DB unavailable — fall through to env/demo defaults.
    billingPlanCodes = [];
  }
  return {
    plan: resolveAccessIntelligencePlan({
      ...input,
      billingPlanCodes,
    }),
    billingPlanCodes,
  };
}

export async function checkEntitlementForUser(input: {
  userId: string;
  roles: string[];
  organisationId?: string | null;
  feature: AccessIntelligenceFeature;
  planOverride?: AccessIntelligencePlan | null;
}): Promise<EntitlementDecision> {
  const { billingPlanCodes } = await resolveAccessIntelligencePlanForUser(input);
  return checkEntitlement({
    ...input,
    billingPlanCodes,
  });
}
