import type { MapAbleUserRole, ProfileOnboardingState } from "@prisma/client";

import { defaultDashboardPath } from "@/lib/auth/roles";

export type RoleRouterInput = {
  primaryRole: MapAbleUserRole;
  onboardingStatus: ProfileOnboardingState;
  requestedPath?: string | null;
};

const SAFE_INTERNAL_PREFIXES = ["/dashboard", "/provider", "/admin", "/jonathan"];

/**
 * Post-auth redirect. OAuth/login provider never grants elevated roles;
 * onboarding and verification gates apply for provider/worker/admin paths.
 */
export function getPostAuthRedirectPath({
  primaryRole,
  onboardingStatus,
  requestedPath,
}: RoleRouterInput): string {
  if (requestedPath && isSafeRedirectPath(requestedPath)) {
    return requestedPath;
  }

  if (onboardingStatus === "not_started" || onboardingStatus === "in_progress") {
    if (
      primaryRole === "provider_admin" ||
      primaryRole === "transport_operator"
    ) {
      return "/provider/onboarding";
    }
    return "/dashboard?onboarding=1";
  }

  return defaultDashboardPath(primaryRole);
}

function isSafeRedirectPath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (path.includes("..")) return false;
  return SAFE_INTERNAL_PREFIXES.some((prefix) => path.startsWith(prefix));
}
