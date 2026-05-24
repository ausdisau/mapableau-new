import type { OnboardingStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/mapable";

const ROLE_DASHBOARD_PATHS: Record<string, string> = {
  participant: "/participant",
  family_member: "/family",
  support_coordinator: "/support-coordinator",
  support_worker: "/worker",
  provider_admin: "/provider",
  transport_operator: "/provider",
  driver: "/driver",
  employer: "/dashboard",
  plan_manager: "/plan-manager",
  mapable_admin: "/admin",
};

export const PRIVILEGED_ROLES: UserRole[] = [
  "mapable_admin",
  "provider_admin",
  "support_worker",
  "driver",
  "transport_operator",
  "plan_manager",
];

export function getDashboardPathForRole(role: string): string {
  return ROLE_DASHBOARD_PATHS[role] ?? "/dashboard";
}

export async function getOnboardingStatus(profileId: string) {
  return prisma.profileOnboardingStatus.findUnique({
    where: { profileId },
  });
}

export async function ensureOnboardingStatus(profileId: string) {
  return prisma.profileOnboardingStatus.upsert({
    where: { profileId },
    create: {
      profileId,
      onboardingStatus: "not_started",
      completedSteps: [],
    },
    update: {},
  });
}

export async function resolvePostAuthRedirect(profileId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: profileId },
    include: { profileOnboardingStatus: true },
  });

  if (!user) return "/login";

  const onboarding = user.profileOnboardingStatus;

  if (!onboarding || onboarding.onboardingStatus === "not_started") {
    return "/onboarding";
  }

  if (onboarding.onboardingStatus === "role_selection" || !onboarding.selectedRole) {
    return "/onboarding/role";
  }

  if (
    onboarding.onboardingStatus === "in_progress" ||
    onboarding.onboardingStatus === "pending_verification"
  ) {
    return onboarding.nextStep ?? "/onboarding";
  }

  if (PRIVILEGED_ROLES.includes(user.primaryRole as UserRole)) {
    if (user.primaryRole === "mapable_admin") {
      return "/admin";
    }
    if (
      ["provider_admin", "transport_operator"].includes(user.primaryRole) &&
      onboarding.onboardingStatus !== "completed"
    ) {
      return "/provider/onboarding";
    }
    if (
      ["support_worker", "driver"].includes(user.primaryRole) &&
      onboarding.onboardingStatus !== "completed"
    ) {
      return "/onboarding/verification";
    }
  }

  return getDashboardPathForRole(user.primaryRole);
}

export async function setOnboardingRole(profileId: string, role: string) {
  return prisma.profileOnboardingStatus.upsert({
    where: { profileId },
    create: {
      profileId,
      selectedRole: role,
      onboardingStatus: "role_selection",
      nextStep: "/onboarding",
    },
    update: {
      selectedRole: role,
      onboardingStatus: "in_progress",
      nextStep: "/onboarding",
    },
  });
}

export async function markOnboardingComplete(profileId: string) {
  return prisma.profileOnboardingStatus.update({
    where: { profileId },
    data: {
      onboardingStatus: "completed" satisfies OnboardingStatus,
      nextStep: null,
    },
  });
}
