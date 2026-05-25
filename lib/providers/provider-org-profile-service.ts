import type { BookingEligibilityStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function getProviderOrganisationForUser(userId: string) {
  const membership = await prisma.organisationMember.findFirst({
    where: {
      userId,
      role: { in: ["provider_admin", "transport_operator"] },
    },
    include: {
      organisation: {
        include: {
          organisationProfile: true,
          providerServices: true,
          providerServiceRegions: true,
          accessCapabilities: true,
        },
      },
    },
  });
  return membership;
}

export async function ensureProviderProfile(organisationId: string) {
  return prisma.providerOrganisationProfile.upsert({
    where: { organisationId },
    create: { organisationId },
    update: {},
  });
}

export async function updateProviderOrganisationProfile(
  organisationId: string,
  data: {
    organisationLegalName?: string;
    tradingName?: string;
    abnOrNzbn?: string;
    primaryContactName?: string;
    primaryContactRole?: string;
    phone?: string;
    website?: string;
    businessAddress?: string;
    publicServiceRegions?: string[];
    providerTypes?: string[];
    ndisRegistrationClaimStatus?: string;
    listingStatus?: string;
  },
  actorUserId: string
) {
  const profile = await prisma.providerOrganisationProfile.upsert({
    where: { organisationId },
    create: { organisationId, ...data },
    update: data,
  });

  await createAuditEvent({
    actorUserId,
    action: "organisation.updated",
    entityType: "provider_profiles",
    entityId: profile.id,
    organisationId,
  });

  return profile;
}

export function resolveBookingEligibility(
  verificationStatus: string,
  profileStatus: BookingEligibilityStatus
): BookingEligibilityStatus {
  if (verificationStatus === "verified" && profileStatus === "eligible") {
    return "eligible";
  }
  if (verificationStatus === "verified") return "submitted";
  return profileStatus === "eligible" ? "submitted" : profileStatus;
}

export async function setBookingEligibility(
  organisationId: string,
  status: BookingEligibilityStatus,
  actorUserId: string
) {
  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
  });
  if (!org) throw new Error("NOT_FOUND");

  const next = resolveBookingEligibility(org.verificationStatus, status);
  const profile = await prisma.providerOrganisationProfile.upsert({
    where: { organisationId },
    create: { organisationId, bookingEligibilityStatus: next },
    update: { bookingEligibilityStatus: next },
  });

  await createAuditEvent({
    actorUserId,
    action: "organisation.verification_changed",
    entityType: "provider_profiles",
    entityId: profile.id,
    organisationId,
    metadata: { bookingEligibilityStatus: next },
  });

  return profile;
}

export async function isOrganisationBookingEligible(
  organisationId: string
): Promise<boolean> {
  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    include: { organisationProfile: true },
  });
  if (!org) return false;
  return (
    org.verificationStatus === "verified" &&
    org.organisationProfile?.bookingEligibilityStatus === "eligible"
  );
}
