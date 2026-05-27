import type { MapAbleUserRole } from "@prisma/client";

import {
  isWorkerProfileComplete,
  workerOnboardingPath,
} from "@/lib/workers/profile-completion";
import { prisma } from "@/lib/prisma";
import type { RegisterInput } from "@/lib/validation/register";

export type RegisterBootstrapResult = {
  userId: string;
  accountType: RegisterInput["accountType"];
  redirectTo: string;
};

export async function bootstrapUserAfterRegister(
  userId: string,
  name: string,
  accountType: RegisterInput["accountType"]
): Promise<RegisterBootstrapResult> {
  const primaryRole: MapAbleUserRole =
    accountType === "support_worker" ? "support_worker" : "participant";

  await prisma.user.update({
    where: { id: userId },
    data: { primaryRole },
  });

  await prisma.userRoleAssignment.upsert({
    where: {
      userId_role: { userId, role: primaryRole },
    },
    create: { userId, role: primaryRole, isPrimary: true },
    update: { isPrimary: true },
  });

  if (accountType === "participant") {
    await prisma.participantProfile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: name,
      },
      update: {},
    });
    await prisma.accessibilityProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    return {
      userId,
      accountType,
      redirectTo: "/dashboard/profile/edit",
    };
  }

  const orgName = name.trim()
    ? `${name.trim()} — Support services`
    : "Independent support worker";

  const organisation = await prisma.organisation.create({
    data: {
      name: orgName,
      organisationType: "independent_support_worker",
      contactEmail: undefined,
      verificationStatus: "not_started",
      status: "active",
    },
  });

  await prisma.organisationMember.create({
    data: {
      userId,
      organisationId: organisation.id,
      role: "support_worker",
    },
  });

  await prisma.workerProfile.create({
    data: {
      userId,
      organisationId: organisation.id,
      displayName: name.trim() || "Support worker",
      verificationStatus: "pending_review",
      active: true,
      affiliationStatus: "active",
      affiliatedAt: new Date(),
    },
  });

  const profile = await prisma.workerProfile.findFirst({
    where: { userId, organisationId: organisation.id },
  });

  const redirectTo =
    profile && !isWorkerProfileComplete(profile)
      ? workerOnboardingPath()
      : "/worker/today";

  return {
    userId,
    accountType,
    redirectTo,
  };
}
