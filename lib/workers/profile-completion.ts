import type { WorkerProfile } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { defaultDashboardPath } from "@/lib/auth/roles";
import type { UserRole } from "@/types/mapable";

type ProfileSlice = Pick<
  WorkerProfile,
  | "displayName"
  | "profileSummary"
  | "serviceTypes"
  | "serviceRegions"
  | "qualificationsSummary"
>;

export function isWorkerProfileComplete(profile: ProfileSlice): boolean {
  return Boolean(
    profile.displayName?.trim() &&
      profile.profileSummary?.trim() &&
      profile.serviceTypes.length > 0 &&
      profile.serviceRegions.length > 0
  );
}

export function workerOnboardingPath(): string {
  return "/worker/onboarding";
}

export function participantProfileEditPath(): string {
  return "/dashboard/profile/edit";
}

export async function resolvePostLoginPathForUser(
  userId: string,
  primaryRole: string
): Promise<string> {
  if (primaryRole === "support_worker") {
    const profile = await prisma.workerProfile.findFirst({
      where: { userId, active: true },
      orderBy: { createdAt: "asc" },
    });
    if (!profile || !isWorkerProfileComplete(profile)) {
      return workerOnboardingPath();
    }
    return "/worker/today";
  }

  if (primaryRole === "participant") {
    const profile = await prisma.participantProfile.findUnique({
      where: { userId },
    });
    if (!profile?.homeSuburb && !profile?.preferredName) {
      return participantProfileEditPath();
    }
    return "/dashboard";
  }

  return defaultDashboardPath(primaryRole as UserRole);
}
