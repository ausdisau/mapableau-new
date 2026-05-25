import type { MapAbleUserRole } from "@prisma/client";

import { defaultDashboardPath } from "@/lib/auth/roles";

export type PostAuthRedirectInput = {
  primaryRole: MapAbleUserRole;
  requestedPath?: string | null;
  isNewRegistration?: boolean;
};

const SAFE_PREFIXES = ["/dashboard", "/provider", "/admin", "/settings", "/core"];

/**
 * Where to send the user after sign-in or OAuth callback.
 * Selected registration role does not grant verification — only routes onboarding.
 */
export function getPostAuthRedirectPath({
  primaryRole,
  requestedPath,
  isNewRegistration = false,
}: PostAuthRedirectInput): string {
  if (
    requestedPath &&
    requestedPath.startsWith("/") &&
    !requestedPath.startsWith("//") &&
    SAFE_PREFIXES.some((p) => requestedPath.startsWith(p))
  ) {
    return requestedPath;
  }

  if (isNewRegistration) {
    return getRegistrationOnboardingPath(primaryRole);
  }

  return defaultDashboardPath(primaryRole);
}

export function getRegistrationOnboardingPath(
  role: MapAbleUserRole,
): string {
  if (role === "provider_admin" || role === "transport_operator") {
    return "/provider/onboarding";
  }
  if (
    role === "support_worker" ||
    role === "driver" ||
    role === "plan_manager"
  ) {
    return "/dashboard?onboarding=profile";
  }
  return "/dashboard?onboarding=welcome";
}
