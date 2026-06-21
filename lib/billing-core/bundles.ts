import type { BillingSubscriptionPlanCode } from "@prisma/client";

import type { BillingFeature } from "@/lib/billing-core/entitlements";

export type RevenueBundleId =
  | "self_managed_participant"
  | "plan_manager_office"
  | "provider_ops"
  | "transport_operator"
  | "employer_hiring";

export type RevenueBundleDefinition = {
  id: RevenueBundleId;
  name: string;
  description: string;
  subscriptionPlans: BillingSubscriptionPlanCode[];
  features: BillingFeature[];
  usageQuotas: {
    abilitypay_exports_per_month?: number;
    api_calls_per_month?: number;
  };
  pilotPriceLabel?: string;
};

export const REVENUE_BUNDLES: RevenueBundleDefinition[] = [
  {
    id: "self_managed_participant",
    name: "Self-Managed Participant",
    description:
      "Dashboard billing, funding sources, and card checkout for self-managed NDIS participants.",
    subscriptionPlans: [],
    features: [],
    usageQuotas: {},
    pilotPriceLabel: "Free during pilot",
  },
  {
    id: "plan_manager_office",
    name: "Plan Manager Office",
    description:
      "AbilityPay workbench, claim pack exports, audit trail, and plan manager billing.",
    subscriptionPlans: ["plan_manager_pro"],
    features: ["plan_manager_exports", "plan_manager_workbench", "abilitypay_ai_assist"],
    usageQuotas: { abilitypay_exports_per_month: 50 },
    pilotPriceLabel: "From $99/mo (pilot)",
  },
  {
    id: "provider_ops",
    name: "Provider Ops",
    description:
      "Provider Pro subscription, Stripe Connect payouts, and care shift billing with platform fee.",
    subscriptionPlans: ["provider_pro"],
    features: ["provider_advanced_matching", "provider_export_unlimited"],
    usageQuotas: {},
    pilotPriceLabel: "From $49/mo + 10% platform fee",
  },
  {
    id: "transport_operator",
    name: "Transport Operator",
    description:
      "Dispatch console, trip billing on completion, and optional ride pooling.",
    subscriptionPlans: ["provider_pro"],
    features: ["provider_advanced_matching"],
    usageQuotas: {},
    pilotPriceLabel: "Platform fee on completed trips",
  },
  {
    id: "employer_hiring",
    name: "Employer Hiring",
    description: "Employer Pro job board, applications, and placement billing (when enabled).",
    subscriptionPlans: ["employer_pro"],
    features: ["employer_job_posts_extended"],
    usageQuotas: {},
    pilotPriceLabel: "From $79/mo (pilot)",
  },
];

export function getBundleById(id: RevenueBundleId): RevenueBundleDefinition | undefined {
  return REVENUE_BUNDLES.find((b) => b.id === id);
}

export function bundlesForPlan(planCode: BillingSubscriptionPlanCode): RevenueBundleDefinition[] {
  return REVENUE_BUNDLES.filter((b) => b.subscriptionPlans.includes(planCode));
}
