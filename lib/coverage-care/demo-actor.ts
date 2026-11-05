import type { CurrentUser } from "@/lib/auth/current-user";
import { getCurrentUser } from "@/lib/auth/current-user";
import { coverageCareConfig } from "@/lib/config/coverage-care";
import { getCoverageCareTenant } from "@/lib/coverage-care/tenant-context";

function enabled(name: string) {
  return process.env[name] === "true";
}

/** Fail-closed demo identities for local pilot UI without full IdP. */
export function isCoverageCareDemoActorEnabled() {
  return coverageCareConfig.enabled && enabled("MAPABLE_COVERAGE_CARE_DEMO_ACTOR");
}

export const DEMO_PARTICIPANT: CurrentUser = {
  id: "user_cc_participant_demo",
  email: "participant.demo@coveragecare.example",
  name: "Demo Participant",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "participant",
  roles: ["participant"],
};

export const DEMO_PROVIDER_ADMIN: CurrentUser = {
  id: "user_cc_provider_admin_demo",
  email: "provider.admin@coveragecare.example",
  name: "Demo Provider Admin",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "provider_admin",
  roles: ["provider_admin"],
};

export async function resolveCoverageCareParticipant(): Promise<
  CurrentUser | null
> {
  const user = await getCurrentUser();
  if (user) return user;
  if (isCoverageCareDemoActorEnabled()) return DEMO_PARTICIPANT;
  return null;
}

export async function resolveCoverageCareProviderAdmin(): Promise<
  CurrentUser | null
> {
  const user = await getCurrentUser();
  if (user) return user;
  if (isCoverageCareDemoActorEnabled()) return DEMO_PROVIDER_ADMIN;
  return null;
}

export function resolveActorTenantId(headerTenantId?: string | null): string {
  if (headerTenantId?.trim()) return headerTenantId.trim();
  return getCoverageCareTenant().id;
}
