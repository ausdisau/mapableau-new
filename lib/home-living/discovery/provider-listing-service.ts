import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { homeLivingConfig } from "@/lib/config/abilitypay-home-living";
import { canProviderAccessOrg } from "@/lib/engagement/engagement-access";
import { containsForbiddenClaim } from "@/lib/home-living/evidence/evidence-normalizer";
import { prisma } from "@/lib/prisma";

export class HomeProviderListingsDisabledError extends Error {
  constructor() {
    super("HOME_PROVIDER_LISTINGS_DISABLED");
    this.name = "HomeProviderListingsDisabledError";
  }
}

function assertProviderListingsEnabled() {
  if (!homeLivingConfig.enabled || !homeLivingConfig.providerListingsEnabled) {
    throw new HomeProviderListingsDisabledError();
  }
}

async function assertOrgAccess(userId: string, organisationId: string) {
  const allowed = await canProviderAccessOrg(userId, organisationId);
  if (!allowed) throw new Error("ORG_ACCESS_DENIED");
}

function rejectForbiddenCopy(text: string | null | undefined) {
  if (text && containsForbiddenClaim(text)) {
    throw new Error("FORBIDDEN_CLAIM_LANGUAGE");
  }
}

export async function createProviderProperty(input: {
  actorUserId: string;
  providerOrganisationId: string;
  title: string;
  addressSummary: string;
  propertyType: string;
  suburb?: string;
  state?: string;
  locationPrecision?: string;
  bedroomCount?: number;
  bathroomCount?: number;
  sdaCategory?: string;
  rentDisplay?: string;
  virtualTourUrl?: string;
  tenancyTermsSummary?: string;
  supportProviderIndependent?: boolean;
  relatedSupportOrganisationId?: string;
  relatedSupportOrganisationNote?: string;
}) {
  assertProviderListingsEnabled();
  await assertOrgAccess(input.actorUserId, input.providerOrganisationId);
  rejectForbiddenCopy(input.title);
  rejectForbiddenCopy(input.tenancyTermsSummary);
  rejectForbiddenCopy(input.relatedSupportOrganisationNote);

  const property = await prisma.accessibleProperty.create({
    data: {
      providerOrganisationId: input.providerOrganisationId,
      title: input.title.trim(),
      addressSummary: input.addressSummary.trim(),
      propertyType: input.propertyType.trim(),
      suburb: input.suburb?.trim() || null,
      state: input.state?.trim() || null,
      locationPrecision: input.locationPrecision ?? "SUBURB_ONLY",
      bedroomCount: input.bedroomCount ?? null,
      bathroomCount: input.bathroomCount ?? null,
      sdaCategory: input.sdaCategory?.trim() || null,
      rentDisplay: input.rentDisplay?.trim() || null,
      virtualTourUrl: input.virtualTourUrl?.trim() || null,
      tenancyTermsSummary: input.tenancyTermsSummary?.trim() || null,
      supportProviderIndependent: input.supportProviderIndependent ?? true,
      relatedSupportOrganisationId:
        input.relatedSupportOrganisationId ?? null,
      relatedSupportOrganisationNote:
        input.relatedSupportOrganisationNote?.trim() || null,
      listingStatus: "draft",
      availabilityStatus: "unknown",
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    organisationId: input.providerOrganisationId,
    action: "home.property.created",
    entityType: "AccessibleProperty",
    entityId: property.id,
  });

  return property;
}

export async function updateProviderProperty(input: {
  actorUserId: string;
  propertyId: string;
  patch: {
    title?: string;
    addressSummary?: string;
    propertyType?: string;
    suburb?: string | null;
    state?: string | null;
    locationPrecision?: string;
    bedroomCount?: number | null;
    bathroomCount?: number | null;
    sdaCategory?: string | null;
    rentDisplay?: string | null;
    virtualTourUrl?: string | null;
    tenancyTermsSummary?: string | null;
    availabilityStatus?: string;
    availableFrom?: Date | null;
    listingStatus?: "draft" | "published" | "archived";
    supportProviderIndependent?: boolean;
    relatedSupportOrganisationId?: string | null;
    relatedSupportOrganisationNote?: string | null;
  };
}) {
  assertProviderListingsEnabled();
  const existing = await prisma.accessibleProperty.findFirst({
    where: { id: input.propertyId, deletedAt: null },
  });
  if (!existing) throw new Error("PROPERTY_NOT_FOUND");
  await assertOrgAccess(input.actorUserId, existing.providerOrganisationId);

  for (const value of Object.values(input.patch)) {
    if (typeof value === "string") rejectForbiddenCopy(value);
  }

  const listingStatus = input.patch.listingStatus;
  const property = await prisma.accessibleProperty.update({
    where: { id: existing.id },
    data: {
      ...input.patch,
      publishedAt:
        listingStatus === "published"
          ? (existing.publishedAt ?? new Date())
          : listingStatus === "draft" || listingStatus === "archived"
            ? null
            : undefined,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    organisationId: existing.providerOrganisationId,
    action: "home.property.updated",
    entityType: "AccessibleProperty",
    entityId: property.id,
    metadata: { listingStatus: property.listingStatus },
  });

  return property;
}

export async function createProviderVacancy(input: {
  actorUserId: string;
  propertyId: string;
  label?: string;
  status?: string;
  availableFrom?: Date | null;
  availableTo?: Date | null;
  notes?: string;
}) {
  assertProviderListingsEnabled();
  const property = await prisma.accessibleProperty.findFirst({
    where: { id: input.propertyId, deletedAt: null },
  });
  if (!property) throw new Error("PROPERTY_NOT_FOUND");
  await assertOrgAccess(input.actorUserId, property.providerOrganisationId);

  const vacancy = await prisma.propertyVacancy.create({
    data: {
      propertyId: property.id,
      label: input.label?.trim() || null,
      status: input.status ?? "open",
      availableFrom: input.availableFrom ?? null,
      availableTo: input.availableTo ?? null,
      notes: input.notes?.trim() || null,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    organisationId: property.providerOrganisationId,
    action: "home.vacancy.created",
    entityType: "PropertyVacancy",
    entityId: vacancy.id,
    metadata: { propertyId: property.id, status: vacancy.status },
  });

  return vacancy;
}

export async function addProviderEvidence(input: {
  actorUserId: string;
  propertyId: string;
  feature: string;
  value: string;
  source: string;
  verificationStatus?: string;
  observedAt?: Date;
  expiresAt?: Date | null;
}) {
  assertProviderListingsEnabled();
  const property = await prisma.accessibleProperty.findFirst({
    where: { id: input.propertyId, deletedAt: null },
  });
  if (!property) throw new Error("PROPERTY_NOT_FOUND");
  await assertOrgAccess(input.actorUserId, property.providerOrganisationId);
  rejectForbiddenCopy(input.value);
  rejectForbiddenCopy(input.feature);

  const evidence = await prisma.propertyAccessibilityEvidence.create({
    data: {
      propertyId: property.id,
      feature: input.feature.trim(),
      value: input.value.trim(),
      source: input.source.trim(),
      verificationStatus: input.verificationStatus ?? "PROVIDER_SUPPLIED",
      observedAt: input.observedAt ?? new Date(),
      expiresAt: input.expiresAt ?? null,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    organisationId: property.providerOrganisationId,
    action: "home.evidence.added",
    entityType: "PropertyAccessibilityEvidence",
    entityId: evidence.id,
    metadata: {
      propertyId: property.id,
      feature: evidence.feature,
      verificationStatus: evidence.verificationStatus,
    },
  });

  return evidence;
}

export async function listProviderProperties(input: {
  actorUserId: string;
  providerOrganisationId: string;
}) {
  assertProviderListingsEnabled();
  await assertOrgAccess(input.actorUserId, input.providerOrganisationId);
  return prisma.accessibleProperty.findMany({
    where: {
      providerOrganisationId: input.providerOrganisationId,
      deletedAt: null,
    },
    include: {
      vacancies: true,
      evidence: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}
