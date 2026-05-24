import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { prisma } from "@/lib/prisma";

export async function userCanAccessOrganisation(
  user: CurrentUser,
  organisationId: string
): Promise<boolean> {
  if (isAdminRole(user.primaryRole)) return true;
  const orgIds = await getUserOrganisationIds(user.id);
  return orgIds.includes(organisationId);
}

export async function userCanAccessVerificationCase(
  user: CurrentUser,
  caseId: string
): Promise<boolean> {
  const verificationCase = await prisma.providerVerificationCase.findUnique({
    where: { id: caseId },
    select: { organisationId: true },
  });
  if (!verificationCase) return false;
  return userCanAccessOrganisation(user, verificationCase.organisationId);
}

export async function userCanAccessWorker(
  user: CurrentUser,
  workerId: string
): Promise<boolean> {
  if (isAdminRole(user.primaryRole)) return true;
  const profile = await prisma.workerProfile.findUnique({
    where: { id: workerId },
    select: { organisationId: true },
  });
  if (!profile) return false;
  return userCanAccessOrganisation(user, profile.organisationId);
}
