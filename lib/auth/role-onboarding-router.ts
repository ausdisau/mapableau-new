import { sanitizeReturnTo } from "@/lib/auth/safe-return-to";
import { defaultDashboardPath } from "@/lib/auth/roles";
import type { UserRole } from "@/types/mapable";

export function onboardingRequired(status: string | undefined): boolean {
  if (!status) return true;
  return status !== "complete";
}

export function resolvePostLoginPath(input: {
  onboardingStatus?: string | null;
  primaryRole?: UserRole | null;
  returnTo?: string | null;
}): string {
  if (onboardingRequired(input.onboardingStatus ?? undefined)) {
    return "/onboarding/role";
  }
  const safe = sanitizeReturnTo(input.returnTo);
  if (safe !== "/dashboard") return safe;
  return defaultDashboardPath(input.primaryRole ?? "participant");
}
