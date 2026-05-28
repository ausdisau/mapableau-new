import type { AccountCentreSections } from "@/lib/core-ui/account-centre-sections";
import type { AccountCentrePersona } from "@/lib/auth/account-access";

export type AccountSummary = {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    timezone: string;
    locale: string;
    primaryRole: string;
    roles: string[];
  };
  persona: AccountCentrePersona;
  sections: AccountCentreSections;
  participantProfile: {
    displayName: string;
    preferredName: string | null;
    homeSuburb: string | null;
    homeState: string | null;
    hasNdisNumber: boolean;
    ndisParticipantNumberMasked: string | null;
  } | null;
  billingAccounts: {
    role: string;
    stripeCustomerId: string | null;
    stripeConnectedAccountId: string | null;
    connectOnboardingComplete: boolean;
  }[];
  organisations: {
    id: string;
    name: string;
    role: string;
  }[];
  workerProfile: {
    id: string;
    displayName: string;
    verificationStatus: string;
    organisationId: string;
    organisationName: string;
  } | null;
  notificationSummary: { unreadCount: number };
  stripe: {
    configured: boolean;
    checkoutAvailable: boolean;
    webhookConfigured: boolean;
    message?: string;
  };
};
