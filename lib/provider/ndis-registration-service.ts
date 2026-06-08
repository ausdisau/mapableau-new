import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { assertOrganisationAccess } from "@/lib/api/phase3-scope";
import { prisma } from "@/lib/prisma";

const NDIS_NUMBER_PATTERN = /^\d{9,10}$/;

export function validateNdisRegistrationNumber(value: string): boolean {
  return NDIS_NUMBER_PATTERN.test(value.replace(/\s/g, ""));
}

export async function getProviderNdisRegistration(
  user: CurrentUser,
  organisationId: string
) {
  await assertOrganisationAccess(user, organisationId);
  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    select: {
      id: true,
      name: true,
      ndisRegistrationClaimed: true,
      ndisRegistrationNumber: true,
      verificationStatus: true,
    },
  });
  if (!org) throw new Error("NOT_FOUND");
  return org;
}

export async function submitProviderNdisRegistration(params: {
  user: CurrentUser;
  organisationId: string;
  ndisRegistrationNumber: string;
  ndisRegistrationClaimed: boolean;
}) {
  const { user, organisationId, ndisRegistrationClaimed } = params;
  await assertOrganisationAccess(user, organisationId);

  const normalized = params.ndisRegistrationNumber.replace(/\s/g, "");
  if (ndisRegistrationClaimed && !validateNdisRegistrationNumber(normalized)) {
    throw new Error("INVALID_NDIS_REGISTRATION_NUMBER");
  }

  const existing = await prisma.organisation.findUnique({
    where: { id: organisationId },
  });
  if (!existing) throw new Error("NOT_FOUND");

  const org = await prisma.organisation.update({
    where: { id: organisationId },
    data: {
      ndisRegistrationClaimed,
      ndisRegistrationNumber: ndisRegistrationClaimed ? normalized : null,
      verificationStatus:
        ndisRegistrationClaimed && existing.verificationStatus === "not_started"
          ? "pending_review"
          : existing.verificationStatus,
    },
  });

  await createAuditEvent({
    actorUserId: user.id,
    actorRole: user.primaryRole as never,
    action: "organisation.ndis_registration_submitted",
    entityType: "Organisation",
    entityId: org.id,
    organisationId: org.id,
    metadata: {
      ndisRegistrationClaimed,
      ndisRegistrationNumberMasked: normalized
        ? `${normalized.slice(0, 3)}***${normalized.slice(-3)}`
        : null,
    },
  });

  return org;
}

export async function verifyProviderNdisRegistration(params: {
  adminUserId: string;
  organisationId: string;
  verified: boolean;
  ndisRegistrationNumber?: string;
}) {
  const org = await prisma.organisation.findUnique({
    where: { id: params.organisationId },
  });
  if (!org) throw new Error("NOT_FOUND");

  const number = params.ndisRegistrationNumber?.replace(/\s/g, "") ?? org.ndisRegistrationNumber;
  if (params.verified && (!number || !validateNdisRegistrationNumber(number))) {
    throw new Error("INVALID_NDIS_REGISTRATION_NUMBER");
  }

  const updated = await prisma.organisation.update({
    where: { id: params.organisationId },
    data: {
      ndisRegistrationClaimed: params.verified,
      ndisRegistrationNumber: params.verified ? number : null,
      verificationStatus: params.verified ? "verified" : org.verificationStatus,
    },
  });

  await createAuditEvent({
    actorUserId: params.adminUserId,
    action: params.verified
      ? "organisation.ndis_registration_verified"
      : "organisation.ndis_registration_rejected",
    entityType: "Organisation",
    entityId: updated.id,
    organisationId: updated.id,
  });

  return updated;
}
