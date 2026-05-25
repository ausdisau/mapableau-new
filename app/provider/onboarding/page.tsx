import { redirect } from "next/navigation";

import { ProviderOnboardingWizard } from "@/components/provider-onboarding/ProviderOnboardingWizard";
import { requireAuth } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import {
  ensureProviderOrganisation,
  isProviderPortalRole,
  resolveProviderAccess,
} from "@/lib/provider-onboarding/provider-access";
import { getProviderOnboardingState } from "@/lib/provider-onboarding/provider-onboarding-service";
import type { MapAbleUserRole } from "@prisma/client";

export default async function ProviderOnboardingPage() {
  const user = await requireAuth("/login");
  const role = user.primaryRole as MapAbleUserRole;

  if (
    !isProviderPortalRole(role) &&
    !user.roles.some((r) => isProviderPortalRole(r as MapAbleUserRole)) &&
    !isAdminRole(role)
  ) {
    redirect("/dashboard");
  }

  let access = await resolveProviderAccess(user);
  if (!access && !isAdminRole(role)) {
    const orgId = await ensureProviderOrganisation(user.id, user.name);
    access = { organisationId: orgId, viewAsAdmin: false };
  }

  if (!access) {
    redirect("/dashboard");
  }

  const state = await getProviderOnboardingState(access.organisationId);

  if (state.canAccessConsole) {
    redirect("/provider/bookings");
  }

  return <ProviderOnboardingWizard initialState={state} />;
}
