import type {
  BillingSubscriptionPlanCode,
  BillingSubscriptionStatus,
  OrganisationStatus,
  VerificationStatus,
} from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { getProviderCloudIntegrations } from "@/lib/providers/provider-cloud-integrations";
import type { ProviderCloudIntegration } from "@/lib/providers/provider-cloud-integrations";
import { prisma } from "@/lib/prisma";

export type ProviderBillingTenancy = "user_billing_account";

export const PROVIDER_BILLING_TENANCY_NOTE =
  "Provider Pro is billed to your signed-in MapAble account, not to the organisation row. All organisations you belong to share this plan until org-scoped billing exists.";

export type ProviderCloudOrganisation = {
  id: string;
  name: string;
  status: OrganisationStatus;
  verificationStatus: VerificationStatus;
  ndisRegistrationClaimed: boolean;
  memberRole: string;
  linkedProviderId: string | null;
  linkedProviderName: string | null;
};

export type ProviderCloudOrgMetrics = {
  teamMemberCount: number;
  activeWorkerCount: number;
  openCareRequestCount: number;
  upcomingShiftCount: number;
  onboardingStatus: string | null;
  onboardingPendingTasks: number;
};

export type ProviderCloudSubscription = {
  planCode: BillingSubscriptionPlanCode | null;
  status: BillingSubscriptionStatus | null;
  label: string;
  connectOnboardingComplete: boolean;
  hasStripeCustomer: boolean;
  tenancy: ProviderBillingTenancy;
  tenancyNote: string;
};

export type ProviderCloudContext = {
  organisations: ProviderCloudOrganisation[];
  primaryOrganisationId: string | null;
  metrics: ProviderCloudOrgMetrics | null;
  subscription: ProviderCloudSubscription;
  integrations: ProviderCloudIntegration[];
  isPlatformAdmin: boolean;
};

export function formatSubscriptionPlanLabel(
  planCode: BillingSubscriptionPlanCode | null | undefined
): string {
  if (!planCode) return "No active plan";
  switch (planCode) {
    case "provider_pro":
      return "Provider Pro";
    case "employer_pro":
      return "Employer Pro";
    case "marketplace_featured":
      return "Marketplace featured";
    default:
      return "MapAble plan";
  }
}

export function formatSubscriptionStatusLabel(
  status: BillingSubscriptionStatus | null | undefined
): string {
  if (!status) return "Not subscribed";
  switch (status) {
    case "active":
      return "Active";
    case "trialing":
      return "Trial";
    case "past_due":
      return "Past due";
    case "canceled":
      return "Canceled";
    case "unpaid":
      return "Unpaid";
    case "incomplete":
      return "Setup in progress";
    default:
      return status;
  }
}

export function buildSubscriptionSummaryLabel(
  planCode: BillingSubscriptionPlanCode | null | undefined,
  status: BillingSubscriptionStatus | null | undefined
): string {
  if (!planCode && !status) return "Not subscribed";
  const plan = formatSubscriptionPlanLabel(planCode);
  const state = formatSubscriptionStatusLabel(status);
  if (!planCode) return state;
  if (status === "active" || status === "trialing") return plan;
  return `${plan} · ${state}`;
}

export async function getProviderOrganisationsForUser(
  userId: string
): Promise<ProviderCloudOrganisation[]> {
  const memberships = await prisma.organisationMember.findMany({
    where: { userId },
    include: {
      organisation: {
        select: {
          id: true,
          name: true,
          status: true,
          verificationStatus: true,
          ndisRegistrationClaimed: true,
          linkedProviders: {
            select: { id: true, name: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m) => {
    const linked = m.organisation.linkedProviders[0] ?? null;
    return {
      id: m.organisation.id,
      name: m.organisation.name,
      status: m.organisation.status,
      verificationStatus: m.organisation.verificationStatus,
      ndisRegistrationClaimed: m.organisation.ndisRegistrationClaimed,
      memberRole: m.role,
      linkedProviderId: linked?.id ?? null,
      linkedProviderName: linked?.name ?? null,
    };
  });
}

export async function getProviderOrgMetrics(
  organisationId: string
): Promise<ProviderCloudOrgMetrics> {
  const [teamMemberCount, activeWorkerCount, openCareRequestCount, upcomingShiftCount, onboarding] =
    await Promise.all([
      prisma.organisationMember.count({ where: { organisationId } }),
      prisma.workerProfile.count({
        where: { organisationId, active: true },
      }),
      prisma.careRequest.count({
        where: {
          assignedOrganisationId: organisationId,
          status: {
            in: [
              "submitted",
              "awaiting_provider_response",
              "matched",
              "confirmed",
              "in_progress",
            ],
          },
        },
      }),
      prisma.careShift.count({
        where: {
          organisationId,
          scheduledStart: { gte: new Date() },
          status: { in: ["scheduled", "confirmed"] },
        },
      }),
      prisma.providerOnboardingWorkflow.findFirst({
        where: { organisationId },
        orderBy: { createdAt: "desc" },
        include: {
          tasks: { where: { status: { not: "completed" } } },
        },
      }),
    ]);

  return {
    teamMemberCount,
    activeWorkerCount,
    openCareRequestCount,
    upcomingShiftCount,
    onboardingStatus: onboarding?.status ?? null,
    onboardingPendingTasks: onboarding?.tasks.length ?? 0,
  };
}

export async function getProviderSubscriptionForUser(
  userId: string
): Promise<ProviderCloudSubscription> {
  const account = await prisma.billingAccount.findUnique({
    where: { userId_role: { userId, role: "provider" } },
    include: {
      subscriptions: {
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  const latest = account?.subscriptions[0];
  const planCode = latest?.planCode ?? null;
  const status = latest?.status ?? null;

  return {
    planCode,
    status,
    label: buildSubscriptionSummaryLabel(planCode, status),
    connectOnboardingComplete: account?.connectOnboardingComplete ?? false,
    hasStripeCustomer: Boolean(account?.stripeCustomerId),
    tenancy: "user_billing_account",
    tenancyNote: PROVIDER_BILLING_TENANCY_NOTE,
  };
}

/** Primary org-scoped tenant context for provider SaaS surfaces. */
export async function getProviderCloudContext(
  userId: string,
  options?: { organisationId?: string; isPlatformAdmin?: boolean }
): Promise<ProviderCloudContext> {
  const organisations = await getProviderOrganisationsForUser(userId);

  let primaryOrganisationId: string | null = null;
  if (options?.organisationId && organisations.some((o) => o.id === options.organisationId)) {
    primaryOrganisationId = options.organisationId;
  } else if (organisations.length > 0) {
    primaryOrganisationId = organisations[0]!.id;
  } else {
    const orgIds = await getUserOrganisationIds(userId);
    primaryOrganisationId = orgIds[0] ?? null;
  }

  const metrics = primaryOrganisationId
    ? await getProviderOrgMetrics(primaryOrganisationId)
    : null;

  const [subscription, integrations] = await Promise.all([
    getProviderSubscriptionForUser(userId),
    getProviderCloudIntegrations(),
  ]);

  return {
    organisations,
    primaryOrganisationId,
    metrics,
    subscription,
    integrations,
    isPlatformAdmin: options?.isPlatformAdmin ?? false,
  };
}

/** Alias for route handlers that need org-scoped provider tenant context from the session user. */
export const getProviderOrganisationForSession = getProviderCloudContext;
