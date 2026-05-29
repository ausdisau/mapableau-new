import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { prisma } from "@/lib/prisma";

export async function canAccessWorkerProfile(
  user: CurrentUser,
  profile: { id: string; userId: string | null; organisationId: string }
): Promise<boolean> {
  if (isAdminRole(user.primaryRole)) return true;
  if (profile.userId === user.id) return true;
  const orgIds = await getUserOrganisationIds(user.id);
  return orgIds.includes(profile.organisationId);
}

export async function loadWorkerProfileOrNull(workerId: string) {
  return prisma.workerProfile.findUnique({
    where: { id: workerId },
    select: {
      id: true,
      userId: true,
      organisationId: true,
      displayName: true,
      profileSummary: true,
      serviceTypes: true,
      serviceRegions: true,
      specialisations: true,
      languages: true,
      verificationStatus: true,
      active: true,
      workerScreeningStatus: true,
      wwccStatus: true,
      firstAidStatus: true,
      insuranceStatus: true,
    },
  });
}
