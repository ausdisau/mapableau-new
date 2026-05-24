import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guards";
import { PRIVILEGED_ROLES, setOnboardingRole } from "@/lib/auth/role-onboarding-router";
import { onboardingRoleSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const user = await requireAuth();
  const parsed = onboardingRoleSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (parsed.data.role === "mapable_admin") {
    return NextResponse.json(
      { error: "Admin roles require manual assignment" },
      { status: 403 },
    );
  }

  const onboarding = await setOnboardingRole(user.id, parsed.data.role);

  return NextResponse.json({
    onboarding,
    requiresVerification: PRIVILEGED_ROLES.includes(parsed.data.role),
    autoApproved: false,
  });
}
