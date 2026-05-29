import type { MapAbleUserRole, Prisma } from "@prisma/client";

import {
  isWorkerProfileComplete,
  workerOnboardingPath,
} from "@/lib/workers/profile-completion";
import { prisma } from "@/lib/prisma";
import type { RegisterInput } from "@/lib/validation/register";

type DbClient = Prisma.TransactionClient | typeof prisma;

export type RegisterBootstrapResult = {
  userId: string;
  accountType: RegisterInput["accountType"];
  redirectTo: string;
};

export async function bootstrapUserAfterRegister(
  userId: string,
  name: string,
  accountType: RegisterInput["accountType"],
  db: DbClient = prisma
): Promise<RegisterBootstrapResult> {
  const primaryRole: MapAbleUserRole =
    accountType === "support_worker" ? "support_worker" : "participant";

  await db.user.update({
    where: { id: userId },
    data: { primaryRole },
  });

  await db.userRoleAssignment.upsert({
    where: {
      userId_role: { userId, role: primaryRole },
    },
    create: { userId, role: primaryRole, isPrimary: true },
    update: { isPrimary: true },
  });

  if (accountType === "participant") {
    await db.participantProfile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: name,
      },
      update: {},
    });
    await db.accessibilityProfile.upsert({
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

  const organisation = await db.organisation.create({
    data: {
      name: orgName,
      organisationType: "independent_support_worker",
      contactEmail: undefined,
      verificationStatus: "not_started",
      status: "active",
    },
  });

  await db.organisationMember.create({
    data: {
      userId,
      organisationId: organisation.id,
      role: "support_worker",
    },
  });

  await db.workerProfile.create({
    data: {
      userId,
      organisationId: organisation.id,
      displayName: name.trim() || "Support worker",
      verificationStatus: "pending_review",
      active: true,
    },
  });

  const profile = await db.workerProfile.findFirst({
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
