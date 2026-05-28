import type { WorkerProfile } from "@prisma/client";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { defaultDashboardPath } from "@/lib/auth/roles";
import { getPrimaryWorkerProfileForUser } from "@/lib/workers/worker-profile-service";
import type { UserRole } from "@/types/mapable";

type ProfileSlice = Pick<
  WorkerProfile,
  | "displayName"
  | "profileSummary"
  | "serviceTypes"
  | "serviceRegions"
  | "qualificationsSummary"
  | "verificationStatus"
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

export function workerProfilePath(): string {
  return "/worker/profile";
}

export function participantProfileEditPath(): string {
  return "/dashboard/profile/edit";
}

export function isParticipantProfileComplete(profile: {
  preferredName: string | null;
  homeSuburb: string | null;
}): boolean {
  return Boolean(profile.preferredName?.trim() || profile.homeSuburb?.trim());
}

/** Redirect support workers with incomplete profiles to onboarding. */
export async function ensureWorkerProfileComplete(userId: string) {
  const profile = await getPrimaryWorkerProfileForUser(userId);
  if (!profile || !isWorkerProfileComplete(profile)) {
    redirect(workerOnboardingPath());
  }
  return profile;
}

export function postLoginPathForRole(
  primaryRole: string,
  workerProfile: ProfileSlice | null,
  participantProfile: {
    preferredName: string | null;
    homeSuburb: string | null;
  } | null
): string {
  if (primaryRole === "support_worker") {
    if (!workerProfile || !isWorkerProfileComplete(workerProfile)) {
      return workerOnboardingPath();
    }
    if (workerProfile.verificationStatus !== "verified") {
      return workerProfilePath();
    }
    return "/worker/today";
  }

  if (primaryRole === "participant") {
    if (!participantProfile || !isParticipantProfileComplete(participantProfile)) {
      return participantProfileEditPath();
    }
    return "/dashboard";
  }

  return defaultDashboardPath(primaryRole as UserRole);
}

export async function resolvePostLoginPathForUser(
  userId: string,
  primaryRole: string
): Promise<string> {
  if (primaryRole === "support_worker") {
    const profile = await prisma.workerProfile.findFirst({
      where: { userId, active: true },
      orderBy: { createdAt: "asc" },
      select: {
        displayName: true,
        profileSummary: true,
        serviceTypes: true,
        serviceRegions: true,
        qualificationsSummary: true,
        verificationStatus: true,
      },
    });
    return postLoginPathForRole(primaryRole, profile, null);
  }

  if (primaryRole === "participant") {
    const profile = await prisma.participantProfile.findUnique({
      where: { userId },
      select: { preferredName: true, homeSuburb: true },
    });
    return postLoginPathForRole(primaryRole, null, profile);
  }

  return postLoginPathForRole(primaryRole, null, null);
}
