import type { NdiaDigitalPartnershipStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Tracks NDIA digital partnership application state.
 * Never stores myID/RAM credentials. credentialsPresent is a boolean flag only.
 */
export async function upsertNdiaDigitalPartnershipApplication(params: {
  organisationId: string;
  status?: NdiaDigitalPartnershipStatus;
  technicalPackReference?: string | null;
  myIdConfigured?: boolean;
  ramConfigured?: boolean;
  credentialsPresent?: boolean;
  notes?: string | null;
  ownerUserId?: string | null;
}) {
  const existing = await prisma.ndiaDigitalPartnershipApplication.findFirst({
    where: { organisationId: params.organisationId },
    orderBy: { createdAt: "desc" },
  });

  const data = {
    status: params.status ?? existing?.status ?? "draft",
    technicalPackReference:
      params.technicalPackReference ?? existing?.technicalPackReference ?? null,
    myIdConfigured: params.myIdConfigured ?? existing?.myIdConfigured ?? false,
    ramConfigured: params.ramConfigured ?? existing?.ramConfigured ?? false,
    credentialsPresent:
      params.credentialsPresent ?? existing?.credentialsPresent ?? false,
    notes: params.notes ?? existing?.notes ?? null,
    ownerUserId: params.ownerUserId ?? existing?.ownerUserId ?? null,
  };

  if (existing) {
    return prisma.ndiaDigitalPartnershipApplication.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.ndiaDigitalPartnershipApplication.create({
    data: {
      organisationId: params.organisationId,
      ...data,
    },
  });
}

export async function listNdiaDigitalPartnershipApplications(
  organisationId?: string
) {
  return prisma.ndiaDigitalPartnershipApplication.findMany({
    where: organisationId ? { organisationId } : undefined,
    orderBy: { updatedAt: "desc" },
  });
}

export function partnershipIsApproved(
  status: NdiaDigitalPartnershipStatus
): boolean {
  return status === "approved";
}
