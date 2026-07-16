/**
 * Access Intelligence commercial entitlements.
 * Server-side policy — not scattered UI conditionals.
 * Demo repository until Stripe BillingSubscriptionPlanCode extends to AI plans.
 */

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

export type EntitlementDecision = {
  allowed: boolean;
  plan: AccessIntelligencePlan;
  feature: AccessIntelligenceFeature;
  reason: string;
};

/**
 * Resolve plan for a user/org.
 * Demo: ACCESS_INTELLIGENCE_PLAN env, else community; platform admins get enterprise.
 * Production: wire to BillingSubscription when AI plan codes exist — do not invent Stripe prices.
 */
export function resolveAccessIntelligencePlan(input: {
  userId: string;
  roles: string[];
  organisationId?: string | null;
  planOverride?: AccessIntelligencePlan | null;
}): AccessIntelligencePlan {
  if (input.planOverride) return input.planOverride;
  if (
    input.roles.includes("mapable_admin") ||
    input.roles.includes("provider_admin")
  ) {
    return "enterprise";
  }
  const fromEnv = process.env.ACCESS_INTELLIGENCE_PLAN as AccessIntelligencePlan | undefined;
  if (fromEnv && fromEnv in PLAN_FEATURES) return fromEnv;
  // Demo defaults to enterprise so Verify + Pilot walkthroughs work without Stripe AI plans.
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
}): EntitlementDecision {
  const plan = resolveAccessIntelligencePlan(input);
  const allowed = planIncludes(plan, input.feature);
  return {
    allowed,
    plan,
    feature: input.feature,
    reason: allowed
      ? `Plan ${plan} includes ${input.feature}.`
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
