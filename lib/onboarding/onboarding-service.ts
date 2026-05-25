import type { MapAbleUserRole } from "@prisma/client";

import { completeRoleOnboarding } from "@/lib/auth/auth-service";
import { getOnboardingStatus } from "@/lib/onboarding/onboarding-status-service";

export async function selectOnboardingRole(params: {
  profileId: string;
  role: MapAbleUserRole;
}) {
  return completeRoleOnboarding({
    profileId: params.profileId,
    role: params.role,
    actorUserId: params.profileId,
  });
}

export async function getOnboardingStatusForApi(profileId: string) {
  const status = await getOnboardingStatus(profileId);
  return {
    hasRole: status.hasRole,
    complete: status.complete,
    nextStepPath: status.nextStepPath,
    primaryRole: status.primaryRole,
    roleStatus: status.roleStatus,
    pendingApproval: status.pendingApproval,
  };
}
