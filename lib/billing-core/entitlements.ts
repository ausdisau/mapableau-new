import type { BillingSubscriptionPlanCode } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type BillingFeature =
  | "provider_advanced_matching"
  | "provider_export_unlimited"
  | "employer_job_posts_extended"
  | "marketplace_featured_listing"
  | "plan_manager_exports"
  | "plan_manager_workbench"
  | "abilitypay_ai_assist";

const PLAN_FEATURES: Record<BillingSubscriptionPlanCode, BillingFeature[]> = {
  provider_pro: ["provider_advanced_matching", "provider_export_unlimited"],
  employer_pro: ["employer_job_posts_extended"],
  marketplace_featured: ["marketplace_featured_listing"],
  plan_manager_pro: ["plan_manager_exports", "plan_manager_workbench", "abilitypay_ai_assist"],
  other: [],
};

export const PLAN_MANAGER_EXPORT_QUOTA_FREE = 3;
export const PLAN_MANAGER_EXPORT_QUOTA_PRO = 50;

export async function getActiveSubscriptions(userId: string) {
  return prisma.billingSubscription.findMany({
    where: {
      userId,
      status: { in: ["active", "trialing"] },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getActiveSubscription(
  userId: string,
  planCode?: BillingSubscriptionPlanCode
) {
  const subs = await getActiveSubscriptions(userId);
  if (planCode) {
    return subs.find((s) => s.planCode === planCode) ?? null;
  }
  return subs[0] ?? null;
}

export async function hasActivePlan(
  userId: string,
  planCode: BillingSubscriptionPlanCode
): Promise<boolean> {
  const sub = await getActiveSubscription(userId, planCode);
  return sub !== null;
}

export async function hasFeature(
  userId: string,
  feature: BillingFeature
): Promise<boolean> {
  const subs = await getActiveSubscriptions(userId);
  for (const sub of subs) {
    const features = PLAN_FEATURES[sub.planCode] ?? [];
    if (features.includes(feature)) return true;
  }
  return false;
}

export function featuresForPlan(planCode: BillingSubscriptionPlanCode): BillingFeature[] {
  return PLAN_FEATURES[planCode] ?? [];
}

export async function getBillingAccountSummary(userId: string, role: "provider" | "employer" = "provider") {
  const account = await prisma.billingAccount.findUnique({
    where: { userId_role: { userId, role } },
    include: {
      subscriptions: {
        orderBy: { updatedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!account) {
    return {
      connectOnboardingComplete: false,
      stripeConnectedAccountId: null,
      subscriptions: [] as Awaited<ReturnType<typeof getActiveSubscriptions>>,
      payments: [] as Awaited<ReturnType<typeof listRecentPayments>>,
    };
  }

  const activeSubs = account.subscriptions.filter((s) =>
    ["active", "trialing"].includes(s.status)
  );
  const payments = await listRecentPayments(userId);

  return {
    connectOnboardingComplete: account.connectOnboardingComplete,
    stripeConnectedAccountId: account.stripeConnectedAccountId,
    subscriptions: activeSubs.length > 0 ? activeSubs : account.subscriptions,
    payments,
  };
}

export async function listRecentPayments(userId: string, limit = 10) {
  return prisma.billingPayment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      invoice: {
        select: {
          id: true,
          serviceType: true,
          totalCents: true,
          status: true,
        },
      },
    },
  });
}
