import type { MapAbleUserRole } from "@prisma/client";

import type { RegistrationRole } from "@/types/registration";

const ROLE_TO_MAPABLE: Record<RegistrationRole, MapAbleUserRole> = {
  participant: "participant",
  nominee_or_family: "family_member",
  provider: "provider_admin",
  support_worker: "support_worker",
  driver: "driver",
  allied_health_practitioner: "allied_health_practitioner",
  support_coordinator: "support_coordinator",
  plan_manager: "plan_manager",
  employer: "employer",
};

const ROLE_ONBOARDING_PATH: Record<RegistrationRole, string> = {
  participant: "/onboarding/participant",
  nominee_or_family: "/onboarding/family",
  provider: "/onboarding/provider",
  support_worker: "/onboarding/worker",
  driver: "/onboarding/driver",
  allied_health_practitioner: "/onboarding/allied-health",
  support_coordinator: "/onboarding/support-coordinator",
  plan_manager: "/onboarding/plan-manager",
  employer: "/onboarding/employer",
};

const ROLE_DASHBOARD: Record<RegistrationRole, string> = {
  participant: "/dashboard",
  nominee_or_family: "/dashboard",
  provider: "/provider/onboarding",
  support_worker: "/dashboard",
  driver: "/dashboard/transport",
  allied_health_practitioner: "/dashboard",
  support_coordinator: "/dashboard",
  plan_manager: "/dashboard",
  employer: "/dashboard/jobs",
};

/** Roles that must never be self-assigned at registration. */
const BLOCKED_SELF_ASSIGN_ROLES: MapAbleUserRole[] = ["mapable_admin"];

export function mapRegistrationRoleToMapAbleRole(
  role: RegistrationRole
): MapAbleUserRole {
  return ROLE_TO_MAPABLE[role];
}

export function onboardingPathForRole(role: RegistrationRole): string {
  return ROLE_ONBOARDING_PATH[role];
}

export function dashboardTargetForRole(role: RegistrationRole): string {
  return ROLE_DASHBOARD[role];
}

export function isRoleAllowedForSelfRegistration(
  role: RegistrationRole
): boolean {
  const mapped = mapRegistrationRoleToMapAbleRole(role);
  return !BLOCKED_SELF_ASSIGN_ROLES.includes(mapped);
}

export function resolveNextStepAfterBaseRegistration(
  role: RegistrationRole
): string {
  return onboardingPathForRole(role);
}
