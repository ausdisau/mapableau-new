import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { getOnboardingStatus } from "@/lib/auth/role-onboarding-router";

export async function GET() {
  const user = await requireAuth();
  const onboarding = await getOnboardingStatus(user.id);

  return NextResponse.json({
    onboarding: onboarding ?? {
      onboardingStatus: "not_started",
      selectedRole: null,
      nextStep: null,
    },
  });
}
