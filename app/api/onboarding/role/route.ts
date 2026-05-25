import type { MapAbleUserRole } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth/current-user";
import { apiUnauthorized } from "@/lib/auth/guards";
import { selectOnboardingRole } from "@/lib/onboarding/onboarding-service";
import { getOnboardingStatusForApi } from "@/lib/onboarding/onboarding-service";
import { profileRoleAssignSchema } from "@/lib/validation/core-schemas";
import { roleRequiresApproval } from "@/types/roles";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiUnauthorized();

  const json = await request.json();
  const parsed = profileRoleAssignSchema.safeParse({
    profileId: user.id,
    role: json.role,
    status: roleRequiresApproval(json.role as MapAbleUserRole)
      ? "pending"
      : "active",
  });

  if (!parsed.success) {
    return Response.json({ error: "Invalid role" }, { status: 400 });
  }

  await selectOnboardingRole({
    profileId: user.id,
    role: parsed.data.role as MapAbleUserRole,
  });

  const onboarding = await getOnboardingStatusForApi(user.id);

  return Response.json({
    ok: true,
    nextStepPath: onboarding.nextStepPath,
    pendingApproval: onboarding.pendingApproval,
  });
}
