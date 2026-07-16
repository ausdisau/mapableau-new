/**
 * Access Intelligence commercial entitlements.
 * Server-side policy — not scattered UI conditionals.
 * Resolves from BillingSubscription plan codes when present (test mode);
 * falls back to env / demo defaults. Does not invent Stripe prices.
 */

import type { BillingSubscriptionPlanCode } from "@prisma/client";

export type AccessIntelligencePlan =
  | "community"
  | "verify_starter"
  | "verify_operations"
  | "verify_portfolio"
  | "learning_organisation"
  | "enterprise";

export type AccessIntelligenceFeature =
  | "passport"
  | "visit_planning"
  | "public_evidence"
  | "barrier_report"
  | "intro_learning"
  | "verify_inventory"
  | "verify_evidence_upload"
  | "verify_public_guide"
  | "verify_incidents"
  | "verify_temporary_routes"
  | "verify_staff_roles"
  | "verify_audit"
  | "verify_portfolio"
  | "verify_bulk_import"
  | "learning_cohorts"
  | "learning_facilitate"
  | "learning_analytics"
  | "pilot_console"
  | "pilot_export"
  | "api_access"
  | "webhooks"
  | "sso";

const PLAN_FEATURES: Record<AccessIntelligencePlan, AccessIntelligenceFeature[]> = {
  community: [
    "passport",
    "visit_planning",
    "public_evidence",
    "barrier_report",
    "intro_learning",
  ],
  verify_starter: [
    "passport",
    "visit_planning",
    "public_evidence",
    "barrier_report",
    "intro_learning",
    "verify_inventory",
    "verify_evidence_upload",
    "verify_public_guide",
  ],
  verify_operations: [
    "passport",
    "visit_planning",
    "public_evidence",
    "barrier_report",
    "intro_learning",
    "verify_inventory",
    "verify_evidence_upload",
    "verify_public_guide",
    "verify_incidents",
    "verify_temporary_routes",
    "verify_staff_roles",
    "verify_audit",
  ],
  verify_portfolio: [
    "passport",
    "visit_planning",
    "public_evidence",
    "barrier_report",
    "intro_learning",
    "verify_inventory",
    "verify_evidence_upload",
    "verify_public_guide",
    "verify_incidents",
    "verify_temporary_routes",
    "verify_staff_roles",
    "verify_audit",
    "verify_portfolio",
    "verify_bulk_import",
  ],
  learning_organisation: [
    "passport",
    "visit_planning",
    "public_evidence",
    "barrier_report",
    "intro_learning",
    "learning_cohorts",
    "learning_facilitate",
    "learning_analytics",
  ],
  enterprise: [
    "passport",
    "visit_planning",
    "public_evidence",
    "barrier_report",
    "intro_learning",
    "verify_inventory",
    "verify_evidence_upload",
    "verify_public_guide",
    "verify_incidents",
    "verify_temporary_routes",
    "verify_staff_roles",
    "verify_audit",
    "verify_portfolio",
    "verify_bulk_import",
    "learning_cohorts",
    "learning_facilitate",
    "learning_analytics",
    "pilot_console",
    "pilot_export",
    "api_access",
    "webhooks",
    "sso",
  ],
};

/** BillingSubscriptionPlanCode → Access Intelligence plan. */
export const BILLING_PLAN_CODE_TO_AI_PLAN: Partial<
  Record<BillingSubscriptionPlanCode, AccessIntelligencePlan>
> = {
  ai_verify_starter: "verify_starter",
  ai_verify_operations: "verify_operations",
  ai_verify_portfolio: "verify_portfolio",
  ai_learning_organisation: "learning_organisation",
  ai_enterprise: "enterprise",
};

export const AI_PLAN_TO_BILLING_PLAN_CODE: Record<
  Exclude<AccessIntelligencePlan, "community">,
  BillingSubscriptionPlanCode
> = {
  verify_starter: "ai_verify_starter",
  verify_operations: "ai_verify_operations",
  verify_portfolio: "ai_verify_portfolio",
  learning_organisation: "ai_learning_organisation",
  enterprise: "ai_enterprise",
};

const AI_PLAN_RANK: Record<AccessIntelligencePlan, number> = {
  community: 0,
  verify_starter: 1,
  learning_organisation: 1,
  verify_operations: 2,
  verify_portfolio: 3,
  enterprise: 4,
};

export type EntitlementDecision = {
  allowed: boolean;
  plan: AccessIntelligencePlan;
  feature: AccessIntelligenceFeature;
  reason: string;
  source: "override" | "admin" | "billing_subscription" | "env" | "demo_default" | "community_default";
};

export function mapBillingPlanCodeToAccessIntelligencePlan(
  planCode: BillingSubscriptionPlanCode | string,
): AccessIntelligencePlan | null {
  return BILLING_PLAN_CODE_TO_AI_PLAN[planCode as BillingSubscriptionPlanCode] ?? null;
}

export function pickHighestAccessIntelligencePlan(
  plans: AccessIntelligencePlan[],
): AccessIntelligencePlan {
  return plans.reduce<AccessIntelligencePlan>((best, next) => {
    return AI_PLAN_RANK[next] > AI_PLAN_RANK[best] ? next : best;
  }, "community");
}

/**
 * Synchronous resolution (override / env / demo). Prefer async resolver when a user id is known.
 */
export function resolveAccessIntelligencePlan(input: {
  userId: string;
  roles: string[];
  organisationId?: string | null;
  planOverride?: AccessIntelligencePlan | null;
  billingPlanCodes?: BillingSubscriptionPlanCode[];
}): AccessIntelligencePlan {
  if (input.planOverride) return input.planOverride;
  if (
    input.roles.includes("mapable_admin") ||
    input.roles.includes("provider_admin")
  ) {
    return "enterprise";
  }
  if (input.billingPlanCodes?.length) {
    const mapped = input.billingPlanCodes
      .map(mapBillingPlanCodeToAccessIntelligencePlan)
      .filter((p): p is AccessIntelligencePlan => p !== null);
    if (mapped.length) return pickHighestAccessIntelligencePlan(mapped);
  }
  const fromEnv = process.env.ACCESS_INTELLIGENCE_PLAN as AccessIntelligencePlan | undefined;
  if (fromEnv && fromEnv in PLAN_FEATURES) return fromEnv;
  if (process.env.ACCESS_INTELLIGENCE_DEMO_MODE !== "false") {
    return "enterprise";
  }
  return "community";
}

export function planIncludes(
  plan: AccessIntelligencePlan,
  feature: AccessIntelligenceFeature,
): boolean {
  return PLAN_FEATURES[plan].includes(feature);
}

export function checkEntitlement(input: {
  userId: string;
  roles: string[];
  organisationId?: string | null;
  feature: AccessIntelligenceFeature;
  planOverride?: AccessIntelligencePlan | null;
  billingPlanCodes?: BillingSubscriptionPlanCode[];
}): EntitlementDecision {
  let source: EntitlementDecision["source"] = "community_default";
  if (input.planOverride) source = "override";
  else if (
    input.roles.includes("mapable_admin") ||
    input.roles.includes("provider_admin")
  ) {
    source = "admin";
  } else if (input.billingPlanCodes?.length) {
    const mapped = input.billingPlanCodes
      .map(mapBillingPlanCodeToAccessIntelligencePlan)
      .filter((p): p is AccessIntelligencePlan => p !== null);
    if (mapped.length) source = "billing_subscription";
  } else if (
    process.env.ACCESS_INTELLIGENCE_PLAN &&
    process.env.ACCESS_INTELLIGENCE_PLAN in PLAN_FEATURES
  ) {
    source = "env";
  } else if (process.env.ACCESS_INTELLIGENCE_DEMO_MODE !== "false") {
    source = "demo_default";
  }

  const plan = resolveAccessIntelligencePlan(input);
  const allowed = planIncludes(plan, input.feature);
  return {
    allowed,
    plan,
    feature: input.feature,
    source,
    reason: allowed
      ? `Plan ${plan} includes ${input.feature} (source: ${source}).`
      : `Plan ${plan} does not include ${input.feature}. Upgrade required.`,
  };
}

export function listPlanFeatures(plan: AccessIntelligencePlan): AccessIntelligenceFeature[] {
  return [...PLAN_FEATURES[plan]];
}

export const ACCESS_INTELLIGENCE_PLAN_LABELS: Record<AccessIntelligencePlan, string> = {
  community: "Community",
  verify_starter: "Verify Starter",
  verify_operations: "Verify Operations",
  verify_portfolio: "Verify Portfolio",
  learning_organisation: "Learning Organisation",
  enterprise: "Enterprise",
};
