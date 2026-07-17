import type { OversightBodyType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createOversightBody(params: {
  name: string;
  bodyType: OversightBodyType;
  tenantId?: string;
  status?: string;
  termMonths?: number;
}) {
  return prisma.oversightBody.create({
    data: {
      ...params,
      status: params.status ?? "active",
    },
  });
}

export async function addOversightMembership(params: {
  bodyId: string;
  userId?: string;
  displayName: string;
  constituency: string;
  termStart: Date;
  termEnd?: Date;
  status?: string;
  remunerationNote?: string;
}) {
  return prisma.oversightMembership.create({
    data: {
      ...params,
      status: params.status ?? "active",
    },
  });
}

export async function listOversightBodyMembers(bodyId: string) {
  return prisma.oversightMembership.findMany({
    where: { bodyId, status: "active" },
    orderBy: { termStart: "asc" },
  });
}

export async function suspendOversightMembership(membershipId: string) {
  return prisma.oversightMembership.update({
    where: { id: membershipId },
    data: { status: "suspended" },
  });
}
