import type { CurrentUser } from "@/lib/auth/current-user";
import {
  getAccountCentrePersona,
  userHasPermission,
} from "@/lib/auth/account-access";
import { getAccountCentreSections } from "@/lib/core-ui/account-centre-sections";
import type { AccountSummary } from "@/lib/account/account-summary-types";
import { maskNdisNumber } from "@/lib/crypto/ndis";
import { isBillingStripeConfigured } from "@/lib/billing-core/config";
import { stripeConfig, stripeNotConfiguredResponse } from "@/lib/stripe/config";
import { prisma } from "@/lib/prisma";

export type { AccountSummary } from "@/lib/account/account-summary-types";

export async function buildAccountSummary(
  user: CurrentUser
): Promise<AccountSummary> {
  const sections = getAccountCentreSections(user);
  const persona = getAccountCentrePersona(user);

  const [
    participantProfile,
    billingAccounts,
    orgMemberships,
    workerProfile,
    unreadCount,
  ] = await Promise.all([
    sections.profile
      ? prisma.participantProfile.findUnique({
          where: { userId: user.id },
        })
      : Promise.resolve(null),
    sections.billing
      ? prisma.billingAccount.findMany({
          where: { userId: user.id },
          select: {
            role: true,
            stripeCustomerId: true,
            stripeConnectedAccountId: true,
            connectOnboardingComplete: true,
          },
        })
      : Promise.resolve([]),
    sections.organisation
      ? prisma.organisationMember.findMany({
          where: { userId: user.id },
          include: {
            organisation: { select: { id: true, name: true } },
          },
        })
      : Promise.resolve([]),
    sections.workerProfile
      ? prisma.workerProfile.findFirst({
          where: { userId: user.id, active: true },
          include: {
            organisation: { select: { id: true, name: true } },
          },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve(null),
    sections.notifications
      ? prisma.notification.count({
          where: { userId: user.id, readAt: null },
        })
      : Promise.resolve(0),
  ]);

  const stripeConfigured = isBillingStripeConfigured();
  const notConfigured = stripeNotConfiguredResponse();

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      timezone: user.timezone,
      locale: user.locale,
      primaryRole: user.primaryRole,
      roles: user.roles,
    },
    persona,
    sections,
    participantProfile: participantProfile
      ? {
          displayName: participantProfile.displayName,
          preferredName: participantProfile.preferredName,
          homeSuburb: participantProfile.homeSuburb,
          homeState: participantProfile.homeState,
          hasNdisNumber: Boolean(participantProfile.ndisParticipantNumberEnc),
          ndisParticipantNumberMasked: participantProfile.ndisParticipantNumberEnc
            ? maskNdisNumber("0000000000")
            : null,
        }
      : null,
    billingAccounts,
    organisations: orgMemberships.map((m) => ({
      id: m.organisation.id,
      name: m.organisation.name,
      role: m.role,
    })),
    workerProfile: workerProfile
      ? {
          id: workerProfile.id,
          displayName: workerProfile.displayName,
          verificationStatus: workerProfile.verificationStatus,
          organisationId: workerProfile.organisation.id,
          organisationName: workerProfile.organisation.name,
        }
      : null,
    notificationSummary: { unreadCount },
    stripe: {
      configured: stripeConfigured,
      checkoutAvailable: stripeConfigured,
      webhookConfigured: Boolean(stripeConfig.webhookSecret),
      ...(stripeConfigured ? {} : { message: notConfigured.message }),
    },
  };
}

export function canManageAccountContact(user: CurrentUser): boolean {
  return userHasPermission(user, "account:manage:self");
}
