import { prisma } from "@/lib/prisma";

export type RecipientVerification =
  | { ok: true; organisationId: string; displayName: string }
  | { ok: false; reason: string };

/**
 * Verify an organisation is an eligible Access Passport recipient for a participant.
 * Eligibility: active organisation AND (provider relationship OR care/booking link).
 * Never trust a client-supplied display label as authority.
 */
export async function verifyPassportRecipientOrganisation(params: {
  participantUserId: string;
  organisationId: string;
}): Promise<RecipientVerification> {
  const org = await prisma.organisation.findFirst({
    where: {
      id: params.organisationId,
      status: "active",
    },
    select: { id: true, name: true },
  });
  if (!org) {
    return { ok: false, reason: "Organisation not found or inactive." };
  }

  const relationship = await prisma.participantProviderRelationship.findUnique({
    where: {
      participantId_providerOrgId: {
        participantId: params.participantUserId,
        providerOrgId: org.id,
      },
    },
    select: { id: true, status: true },
  });

  if (relationship) {
    return { ok: true, organisationId: org.id, displayName: org.name };
  }

  const careLink = await prisma.careRequest.findFirst({
    where: {
      participantId: params.participantUserId,
      assignedOrganisationId: org.id,
    },
    select: { id: true },
  });
  if (careLink) {
    return { ok: true, organisationId: org.id, displayName: org.name };
  }

  const bookingLink = await prisma.booking.findFirst({
    where: {
      participantId: params.participantUserId,
      assignedOrganisationId: org.id,
    },
    select: { id: true },
  });
  if (bookingLink) {
    return { ok: true, organisationId: org.id, displayName: org.name };
  }

  return {
    ok: false,
    reason:
      "No verified service, booking or provider relationship with that organisation.",
  };
}

/** Organisations the participant may select as passport recipients. */
export async function listEligiblePassportRecipients(participantUserId: string) {
  const relationships = await prisma.participantProviderRelationship.findMany({
    where: { participantId: participantUserId },
    select: {
      providerOrg: { select: { id: true, name: true, status: true } },
    },
    take: 50,
  });

  const fromCare = await prisma.careRequest.findMany({
    where: {
      participantId: participantUserId,
      assignedOrganisationId: { not: null },
    },
    select: {
      assignedOrganisation: { select: { id: true, name: true, status: true } },
    },
    take: 50,
  });

  const map = new Map<string, string>();
  for (const row of relationships) {
    if (row.providerOrg.status === "active") {
      map.set(row.providerOrg.id, row.providerOrg.name);
    }
  }
  for (const row of fromCare) {
    if (row.assignedOrganisation?.status === "active") {
      map.set(row.assignedOrganisation.id, row.assignedOrganisation.name);
    }
  }

  return [...map.entries()].map(([id, name]) => ({ id, name }));
}
