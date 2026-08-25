import type { Prisma } from "@prisma/client";

import { homeLivingConfig } from "@/lib/config/abilitypay-home-living";
import type {
  PropertySearchFilters,
  PublicPropertyDetail,
  PublicPropertySummary,
} from "@/lib/home-living/contracts/property";
import {
  toPublicPropertyDetail,
  toPublicPropertySummary,
  type PropertyRow,
} from "@/lib/home-living/evidence/evidence-normalizer";
import { prisma } from "@/lib/prisma";

export class HomeDiscoveryDisabledError extends Error {
  constructor() {
    super("HOME_DISCOVERY_DISABLED");
    this.name = "HomeDiscoveryDisabledError";
  }
}

function assertDiscoveryEnabled() {
  if (!homeLivingConfig.enabled || !homeLivingConfig.discoveryEnabled) {
    throw new HomeDiscoveryDisabledError();
  }
}

const publishedWhere: Prisma.AccessiblePropertyWhereInput = {
  deletedAt: null,
  listingStatus: "published",
};

const listInclude = {
  vacancies: true,
  evidence: true,
} satisfies Prisma.AccessiblePropertyInclude;

const detailInclude = {
  vacancies: true,
  evidence: true,
  media: { orderBy: { sortOrder: "asc" as const } },
  capabilityProfile: true,
} satisfies Prisma.AccessiblePropertyInclude;

function toRow(
  property: Prisma.AccessiblePropertyGetPayload<{
    include: typeof detailInclude;
  }>,
): PropertyRow {
  return {
    id: property.id,
    title: property.title,
    addressSummary: property.addressSummary,
    suburb: property.suburb,
    state: property.state,
    locationPrecision: property.locationPrecision,
    propertyType: property.propertyType,
    bedroomCount: property.bedroomCount,
    bathroomCount: property.bathroomCount,
    sdaCategory: property.sdaCategory,
    rentDisplay: property.rentDisplay,
    availabilityStatus: property.availabilityStatus,
    availableFrom: property.availableFrom,
    supportProviderIndependent: property.supportProviderIndependent,
    tenancyTermsSummary: property.tenancyTermsSummary,
    virtualTourUrl: property.virtualTourUrl,
    gaisPlaceId: property.gaisPlaceId,
    relatedSupportOrganisationNote: property.relatedSupportOrganisationNote,
    vacancies: property.vacancies.map((v) => ({
      id: v.id,
      label: v.label,
      status: v.status,
      availableFrom: v.availableFrom,
      availableTo: v.availableTo,
    })),
    evidence: property.evidence.map((e) => ({
      feature: e.feature,
      value: e.value,
      source: e.source,
      verificationStatus: e.verificationStatus,
      observedAt: e.observedAt,
      expiresAt: e.expiresAt,
      disputedAt: e.disputedAt,
    })),
    media: property.media.map((m) => ({
      id: m.id,
      kind: m.kind,
      url: m.url,
      altText: m.altText,
      caption: m.caption,
    })),
    capabilityProfile: property.capabilityProfile
      ? { capabilitiesJson: property.capabilityProfile.capabilitiesJson }
      : null,
  };
}

export async function searchPublishedProperties(
  filters: PropertySearchFilters = {},
): Promise<PublicPropertySummary[]> {
  assertDiscoveryEnabled();
  const where: Prisma.AccessiblePropertyWhereInput = { ...publishedWhere };
  if (filters.suburb) {
    where.suburb = { contains: filters.suburb, mode: "insensitive" };
  }
  if (filters.propertyType) where.propertyType = filters.propertyType;
  if (typeof filters.bedroomCount === "number") {
    where.bedroomCount = { gte: filters.bedroomCount };
  }
  if (filters.availabilityStatus) {
    where.availabilityStatus = filters.availabilityStatus;
  }
  if (filters.sdaCategory) where.sdaCategory = filters.sdaCategory;
  if (filters.accessibilityFeatures?.length) {
    where.evidence = {
      some: { feature: { in: filters.accessibilityFeatures } },
    };
  }

  const rows = await prisma.accessibleProperty.findMany({
    where,
    include: listInclude,
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: Math.min(filters.limit ?? 50, 100),
  });

  return rows.map((row) =>
    toPublicPropertySummary({
      ...row,
      media: [],
      capabilityProfile: null,
    }),
  );
}

export async function getPublishedPropertyDetail(
  propertyId: string,
): Promise<PublicPropertyDetail | null> {
  assertDiscoveryEnabled();
  const property = await prisma.accessibleProperty.findFirst({
    where: { id: propertyId, ...publishedWhere },
    include: detailInclude,
  });
  if (!property) return null;
  return toPublicPropertyDetail(toRow(property));
}

export async function getPublishedPropertiesByIds(
  propertyIds: string[],
): Promise<PublicPropertyDetail[]> {
  assertDiscoveryEnabled();
  const uniqueIds = [...new Set(propertyIds)].slice(0, 4);
  if (!uniqueIds.length) return [];
  const rows = await prisma.accessibleProperty.findMany({
    where: { id: { in: uniqueIds }, ...publishedWhere },
    include: detailInclude,
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return uniqueIds
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => toPublicPropertyDetail(toRow(r)));
}
