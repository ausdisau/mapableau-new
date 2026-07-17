import { prisma } from "@/lib/prisma";

import { assertTransitionAllowed } from "./status-transitions";

export async function startOffboarding(input: {
  organisationId: string;
  actorUserId: string;
  reason: string;
}) {
  if (!input.reason || input.reason.trim().length < 30) {
    throw new Error("OFFBOARDING_REASON_TOO_SHORT");
  }
  const org = await prisma.organisation.findUnique({
    where: { id: input.organisationId },
    select: { id: true, tenantStatus: true },
  });
  if (!org) throw new Error("ORGANISATION_NOT_FOUND");
  assertTransitionAllowed(org.tenantStatus, "offboarding");

  return prisma.$transaction(async (tx) => {
    await tx.tenantStatusTransition.create({
      data: {
        organisationId: input.organisationId,
        fromStatus: org.tenantStatus,
        toStatus: "offboarding",
        reason: input.reason,
        actorUserId: input.actorUserId,
      },
    });
    return tx.organisation.update({
      where: { id: input.organisationId },
      data: {
        tenantStatus: "offboarding",
        offboardingStartedAt: new Date(),
      },
    });
  });
}

export async function archiveTenant(input: {
  organisationId: string;
  actorUserId: string;
  reason: string;
}) {
  if (!input.reason || input.reason.trim().length < 30) {
    throw new Error("ARCHIVE_REASON_TOO_SHORT");
  }
  const org = await prisma.organisation.findUnique({
    where: { id: input.organisationId },
    select: { id: true, tenantStatus: true },
  });
  if (!org) throw new Error("ORGANISATION_NOT_FOUND");
  assertTransitionAllowed(org.tenantStatus, "archived");

  return prisma.$transaction(async (tx) => {
    await tx.tenantStatusTransition.create({
      data: {
        organisationId: input.organisationId,
        fromStatus: org.tenantStatus,
        toStatus: "archived",
        reason: input.reason,
        actorUserId: input.actorUserId,
      },
    });
    return tx.organisation.update({
      where: { id: input.organisationId },
      data: { tenantStatus: "archived", archivedAt: new Date() },
    });
  });
}
