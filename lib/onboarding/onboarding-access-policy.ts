import type { OnboardingFlowStatus } from "@/types/registration";
import type { RegistrationRole } from "@/types/registration";

import { onboardingPathForRole } from "@/lib/onboarding/onboarding-router";

const PUBLIC_ONBOARDING_PREFIXES = [
  "/register",
  "/login",
  "/onboarding",
];

export function isPublicOnboardingPath(pathname: string): boolean {
  return PUBLIC_ONBOARDING_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function shouldRedirectToOnboarding(params: {
  pathname: string;
  isAuthenticated: boolean;
  onboardingStatus: OnboardingFlowStatus | null;
  selectedRole: RegistrationRole | null;
  nextStep: string | null;
}): string | null {
  if (!params.isAuthenticated) return null;
  if (isPublicOnboardingPath(params.pathname)) return null;
  if (
    params.onboardingStatus === "complete" ||
    params.onboardingStatus === "submitted"
  ) {
    return null;
  }
  if (params.onboardingStatus === "not_started" || !params.selectedRole) {
    return "/onboarding/role";
  }
  if (params.onboardingStatus === "in_progress") {
    if (params.nextStep) return params.nextStep;
    if (params.selectedRole) return onboardingPathForRole(params.selectedRole);
    return "/onboarding";
  }
  return null;
}

/** Service workers cannot book/match/dispatch until verified. */
export function blocksServiceEligibilityUntilVerified(
  role: RegistrationRole
): boolean {
  return (
    role === "provider" ||
    role === "support_worker" ||
    role === "driver" ||
    role === "allied_health_practitioner"
  );
}
