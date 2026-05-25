import type { MapAbleUserRole, ProfileRoleStatus } from "@prisma/client";

import { getDbClient } from "@/lib/db/db-client";
import { roleRequiresApproval } from "@/types/roles";

export interface OnboardingStatus {
  hasRole: boolean;
  complete: boolean;
  nextStepPath: string;
  primaryRole?: MapAbleUserRole;
  roleStatus?: ProfileRoleStatus;
  pendingApproval: boolean;
}

export async function getOnboardingStatus(
  profileId: string
): Promise<OnboardingStatus> {
  const user = await getDbClient().user.findUnique({
    where: { id: profileId },
    include: {
      roleAssignments: true,
      participantProfile: true,
      organisationMemberships: true,
    },
  });

  if (!user) {
    return {
      hasRole: false,
      complete: false,
      nextStepPath: "/onboarding/role",
      pendingApproval: false,
    };
  }

  const primaryAssignment =
    user.roleAssignments.find((r) => r.isPrimary) ??
    user.roleAssignments[0];

  if (!primaryAssignment) {
    return {
      hasRole: false,
      complete: false,
      nextStepPath: "/onboarding/role",
      pendingApproval: false,
    };
  }

  const pendingApproval =
    primaryAssignment.status === "pending" &&
    roleRequiresApproval(primaryAssignment.role);

  if (pendingApproval) {
    return {
      hasRole: true,
      complete: false,
      nextStepPath: "/onboarding/complete",
      primaryRole: primaryAssignment.role,
      roleStatus: primaryAssignment.status,
      pendingApproval: true,
    };
  }

  if (primaryAssignment.role === "participant" && !user.participantProfile) {
    return {
      hasRole: true,
      complete: false,
      nextStepPath: "/onboarding",
      primaryRole: primaryAssignment.role,
      roleStatus: primaryAssignment.status,
      pendingApproval: false,
    };
  }

  if (
    (primaryAssignment.role === "provider_admin" ||
      primaryAssignment.role === "transport_operator") &&
    user.organisationMemberships.length === 0
  ) {
    return {
      hasRole: true,
      complete: false,
      nextStepPath: "/provider/onboarding",
      primaryRole: primaryAssignment.role,
      roleStatus: primaryAssignment.status,
      pendingApproval: false,
    };
  }

  return {
    hasRole: true,
    complete: true,
    nextStepPath: "/onboarding/complete",
    primaryRole: primaryAssignment.role,
    roleStatus: primaryAssignment.status,
    pendingApproval: false,
  };
}
