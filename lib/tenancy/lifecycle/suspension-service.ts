import { prisma } from "@/lib/prisma";

import { assertTransitionAllowed } from "./status-transitions";

export async function suspendTenant(input: {
  organisationId: string;
  actorUserId: string;
  reason: string;
}) {
  if (!input.reason || input.reason.trim().length < 20) {
    throw new Error("SUSPENSION_REASON_TOO_SHORT");
  }
  const org = await prisma.organisation.findUnique({
    where: { id: input.organisationId },
    select: { id: true, tenantStatus: true },
  });
  if (!org) throw new Error("ORGANISATION_NOT_FOUND");
  assertTransitionAllowed(org.tenantStatus, "suspended");

  return prisma.$transaction(async (tx) => {
    await tx.tenantStatusTransition.create({
      data: {
        organisationId: input.organisationId,
        fromStatus: org.tenantStatus,
        toStatus: "suspended",
        reason: input.reason,
        actorUserId: input.actorUserId,
      },
    });
    return tx.organisation.update({
      where: { id: input.organisationId },
      data: { tenantStatus: "suspended", suspendedAt: new Date() },
    });
  });
}

export async function restrictTenant(input: {
  organisationId: string;
  actorUserId: string;
  reason: string;
}) {
  if (!input.reason || input.reason.trim().length < 10) {
    throw new Error("RESTRICT_REASON_TOO_SHORT");
  }
  const org = await prisma.organisation.findUnique({
    where: { id: input.organisationId },
    select: { id: true, tenantStatus: true },
  });
  if (!org) throw new Error("ORGANISATION_NOT_FOUND");
  assertTransitionAllowed(org.tenantStatus, "restricted");

  return prisma.$transaction(async (tx) => {
    await tx.tenantStatusTransition.create({
      data: {
        organisationId: input.organisationId,
        fromStatus: org.tenantStatus,
        toStatus: "restricted",
        reason: input.reason,
        actorUserId: input.actorUserId,
      },
    });
    return tx.organisation.update({
      where: { id: input.organisationId },
      data: { tenantStatus: "restricted", restrictedAt: new Date() },
    });
  });
}
