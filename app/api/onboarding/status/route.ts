import { NextResponse } from "next/server";

import { requireOnboardingUser } from "@/lib/onboarding/onboarding-api";
import { getOnboardingStatus } from "@/lib/onboarding/onboarding-service";
import { evaluateEligibility } from "@/lib/onboarding/eligibility-gates";
import { dashboardTargetForRole } from "@/lib/onboarding/onboarding-router";
import type { RegistrationRole } from "@/types/registration";

export async function GET() {
  const auth = await requireOnboardingUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;
  const status = await getOnboardingStatus(user.id);
  const role = status.selectedRole;
  const eligibility = role
    ? evaluateEligibility(
        role,
        status.onboardingStatus === "complete" ||
          status.onboardingStatus === "submitted"
      )
    : null;

  return NextResponse.json({
    success: true,
    ...status,
    dashboardTarget: role ? dashboardTargetForRole(role as RegistrationRole) : "/dashboard",
    eligibility,
  });
}
