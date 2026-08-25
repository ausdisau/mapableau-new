import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { homeLivingConfig } from "@/lib/config/abilitypay-home-living";
import type { PublicPropertySummary } from "@/lib/home-living/contracts/property";
import { toPublicPropertySummary } from "@/lib/home-living/evidence/evidence-normalizer";
import { prisma } from "@/lib/prisma";

export class HomeShortlistDisabledError extends Error {
  constructor() {
    super("HOME_SHORTLIST_DISABLED");
    this.name = "HomeShortlistDisabledError";
  }
}

function assertShortlistEnabled() {
  if (!homeLivingConfig.enabled || !homeLivingConfig.discoveryEnabled) {
    throw new HomeShortlistDisabledError();
  }
}

/** Shortlisting never contacts a provider and never shares HomeLivingProfile. */
export async function listShortlistedProperties(
  participantId: string,
): Promise<PublicPropertySummary[]> {
  assertShortlistEnabled();
  const items = await prisma.homeShortlistItem.findMany({
    where: {
      participantId,
      property: { deletedAt: null, listingStatus: "published" },
    },
    include: {
      property: { include: { vacancies: true, evidence: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return items.map((item) =>
    toPublicPropertySummary({
      ...item.property,
      media: [],
      capabilityProfile: null,
    }),
  );
}

export async function addPropertyToShortlist(input: {
  participantId: string;
  propertyId: string;
  actorUserId: string;
}) {
  assertShortlistEnabled();
  const property = await prisma.accessibleProperty.findFirst({
    where: {
      id: input.propertyId,
      deletedAt: null,
      listingStatus: "published",
    },
  });
  if (!property) throw new Error("PROPERTY_NOT_FOUND");

  const item = await prisma.homeShortlistItem.upsert({
    where: {
      participantId_propertyId: {
        participantId: input.participantId,
        propertyId: input.propertyId,
      },
    },
    create: {
      participantId: input.participantId,
      propertyId: input.propertyId,
    },
    update: {},
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "home.property.shortlisted",
    entityType: "HomeShortlistItem",
    entityId: item.id,
    organisationId: property.providerOrganisationId,
    metadata: { propertyId: input.propertyId },
  });

  return item;
}

export async function removePropertyFromShortlist(input: {
  participantId: string;
  propertyId: string;
  actorUserId: string;
}) {
  assertShortlistEnabled();
  const existing = await prisma.homeShortlistItem.findUnique({
    where: {
      participantId_propertyId: {
        participantId: input.participantId,
        propertyId: input.propertyId,
      },
    },
  });
  if (!existing) return null;

  await prisma.homeShortlistItem.delete({ where: { id: existing.id } });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "home.property.shortlist_removed",
    entityType: "HomeShortlistItem",
    entityId: existing.id,
    metadata: { propertyId: input.propertyId },
  });

  return existing;
}
