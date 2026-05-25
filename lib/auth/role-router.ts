import type { MapAbleUserRole } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { getOnboardingStatus } from "@/lib/onboarding/onboarding-status-service";
import { roleRequiresApproval } from "@/types/roles";

export type RoleRouteDecision =
  | { type: "redirect"; path: string }
  | { type: "continue"; path: string };

const ROLE_HOME: Partial<Record<MapAbleUserRole, string>> = {
  participant: "/participant",
  family_member: "/participant",
  provider_admin: "/provider",
  support_worker: "/worker",
  driver: "/driver",
  plan_manager: "/plan-manager",
  mapable_admin: "/admin",
  transport_operator: "/provider",
  support_coordinator: "/coordinator",
  employer: "/employer",
};

export async function resolvePostAuthRoute(
  user: CurrentUser,
  returnTo?: string | null
): Promise<RoleRouteDecision> {
  const onboarding = await getOnboardingStatus(user.id);

  if (!onboarding.hasRole) {
    return { type: "redirect", path: "/onboarding/role" };
  }

  if (!onboarding.complete) {
    return { type: "redirect", path: onboarding.nextStepPath };
  }

  if (returnTo) {
    const { isSafeReturnTo, resolveReturnTo } = await import(
      "@/lib/auth/session-service"
    );
    if (isSafeReturnTo(returnTo)) {
      return { type: "continue", path: resolveReturnTo(returnTo) };
    }
  }

  const home = ROLE_HOME[user.primaryRole] ?? "/dashboard";
  return { type: "continue", path: home };
}

export function isRoleAutoApproved(role: MapAbleUserRole): boolean {
  return !roleRequiresApproval(role);
}
