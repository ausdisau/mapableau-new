import type {
  EvidenceStatus,
  PublicEvidenceItem,
  PublicPropertyDetail,
  PublicPropertySummary,
  RequirementMatchState,
} from "@/lib/home-living/contracts/property";

const CLAIM_SAFETY_NOTE =
  "MapAble does not choose a home for you. Listed facts show their evidence status. Missing evidence stays UNKNOWN — never treated as confirmed access.";

export function normalizeEvidenceStatus(input: {
  verificationStatus: string;
  expiresAt: Date | null;
  disputedAt: Date | null;
  now?: Date;
}): EvidenceStatus {
  const now = input.now ?? new Date();
  if (input.disputedAt) return "DISPUTED";
  if (input.expiresAt && input.expiresAt <= now) return "EXPIRED";
  const status = input.verificationStatus.trim().toUpperCase();
  switch (status) {
    case "VERIFIED":
    case "MAPABLE_VERIFIED":
    case "PROVIDER_SUPPLIED":
    case "SOURCE_SUPPLIED":
    case "COMMUNITY_REPORTED":
    case "UNKNOWN":
    case "DISPUTED":
    case "EXPIRED":
      if (status === "SOURCE_SUPPLIED") return "PROVIDER_SUPPLIED";
      return status as EvidenceStatus;
    case "PROVIDER":
    case "SUPPLIED":
      return "PROVIDER_SUPPLIED";
    default:
      return "UNKNOWN";
  }
}

export function publicLocationDisplay(input: {
  locationPrecision: string;
  suburb: string | null;
  state: string | null;
  addressSummary: string;
}): string {
  const suburbState = [input.suburb, input.state].filter(Boolean).join(", ");
  switch (input.locationPrecision) {
    case "FULL_ADDRESS":
    case "STREET":
      return input.addressSummary;
    case "APPROXIMATE":
      return suburbState || "Approximate location available after enquiry";
    case "SUBURB_ONLY":
    default:
      return suburbState || "Suburb withheld";
  }
}

/** Row shape matching AccessibleProperty + includes used by discovery. */
export type PropertyRow = {
  id: string;
  title: string;
  addressSummary: string;
  suburb: string | null;
  state: string | null;
  locationPrecision: string;
  propertyType: string;
  bedroomCount: number | null;
  bathroomCount: number | null;
  sdaCategory: string | null;
  rentDisplay: string | null;
  availabilityStatus: string;
  availableFrom: Date | null;
  supportProviderIndependent: boolean;
  tenancyTermsSummary: string | null;
  virtualTourUrl: string | null;
  gaisPlaceId: string | null;
  relatedSupportOrganisationNote: string | null;
  vacancies?: Array<{
    id: string;
    label: string | null;
    status: string;
    availableFrom: Date | null;
    availableTo: Date | null;
  }>;
  evidence?: Array<{
    feature: string;
    value: string;
    source: string;
    verificationStatus: string;
    observedAt: Date;
    expiresAt: Date | null;
    disputedAt: Date | null;
  }>;
  media?: Array<{
    id: string;
    kind: string;
    url: string;
    altText: string | null;
    caption: string | null;
  }>;
  capabilityProfile?: {
    capabilitiesJson: unknown;
  } | null;
};

export function toPublicPropertySummary(
  property: PropertyRow,
): PublicPropertySummary {
  const openVacancyCount = (property.vacancies ?? []).filter(
    (v) => v.status === "open" || v.status === "upcoming",
  ).length;
  return {
    id: property.id,
    title: property.title,
    suburb: property.suburb,
    state: property.state,
    locationPrecision: property.locationPrecision,
    propertyType: property.propertyType,
    bedroomCount: property.bedroomCount,
    bathroomCount: property.bathroomCount,
    sdaCategory: property.sdaCategory,
    rentDisplay: property.rentDisplay,
    availabilityStatus: property.availabilityStatus,
    availableFrom: property.availableFrom?.toISOString() ?? null,
    supportProviderIndependent: property.supportProviderIndependent,
    openVacancyCount,
    evidenceFeatureCount: (property.evidence ?? []).length,
    claimSafetyNote: CLAIM_SAFETY_NOTE,
  };
}

function mapEvidence(
  evidence: NonNullable<PropertyRow["evidence"]>,
): PublicEvidenceItem[] {
  return evidence.map((item) => ({
    feature: item.feature,
    value: item.value,
    source: item.source,
    verificationStatus: item.verificationStatus,
    observedAt: item.observedAt.toISOString(),
    expiresAt: item.expiresAt?.toISOString() ?? null,
    disputedAt: item.disputedAt?.toISOString() ?? null,
    displayStatus: normalizeEvidenceStatus(item),
  }));
}

function mapCapabilities(
  capabilitiesJson: unknown,
): PublicPropertyDetail["capabilities"] {
  if (!capabilitiesJson || typeof capabilitiesJson !== "object") return [];
  return Object.entries(capabilitiesJson as Record<string, unknown>).map(
    ([key, raw]) => {
      const entry =
        raw && typeof raw === "object"
          ? (raw as Record<string, unknown>)
          : { value: raw };
      return {
        key,
        value: entry.value ?? null,
        source: String(entry.source ?? "UNKNOWN"),
        verificationStatus: String(entry.verificationStatus ?? "UNKNOWN"),
      };
    },
  );
}

export function toPublicPropertyDetail(
  property: PropertyRow,
): PublicPropertyDetail {
  const evidence = mapEvidence(property.evidence ?? []);
  const capabilities = mapCapabilities(
    property.capabilityProfile?.capabilitiesJson,
  );
  const knownFeatures = new Set(evidence.map((e) => e.feature.toLowerCase()));
  const expected = [
    "entrance.stepFree",
    "bathroom.rollInShower",
    "bedroom.door.clearWidthMm",
    "wheelchairCharging.available",
  ];
  const unknowns = expected.filter((f) => !knownFeatures.has(f.toLowerCase()));

  return {
    ...toPublicPropertySummary(property),
    addressDisplay: publicLocationDisplay(property),
    tenancyTermsSummary: property.tenancyTermsSummary,
    virtualTourUrl: property.virtualTourUrl,
    gaisPlaceId: property.gaisPlaceId,
    relatedSupportOrganisationNote: property.relatedSupportOrganisationNote,
    evidence,
    vacancies: (property.vacancies ?? []).map((v) => ({
      id: v.id,
      label: v.label,
      status: v.status,
      availableFrom: v.availableFrom?.toISOString() ?? null,
      availableTo: v.availableTo?.toISOString() ?? null,
    })),
    media: (property.media ?? []).map((m) => ({
      id: m.id,
      kind: m.kind,
      url: m.url,
      altText: m.altText,
      caption: m.caption,
    })),
    capabilities,
    unknowns,
  };
}

/**
 * Compare selected requirements against property evidence.
 * Missing evidence => UNKNOWN (never a positive access claim).
 */
export function matchRequirementToEvidence(input: {
  requirement: string;
  evidence: PublicEvidenceItem[];
}): RequirementMatchState {
  const needle = input.requirement.trim().toLowerCase();
  if (!needle) return "UNKNOWN";
  const hit = input.evidence.find((item) => {
    const feature = item.feature.toLowerCase();
    const value = item.value.toLowerCase();
    return (
      feature.includes(needle) ||
      needle.includes(feature) ||
      value.includes(needle)
    );
  });
  if (!hit) return "UNKNOWN";
  if (
    hit.displayStatus === "DISPUTED" ||
    hit.displayStatus === "EXPIRED" ||
    hit.displayStatus === "UNKNOWN"
  ) {
    return "UNKNOWN";
  }
  const value = hit.value.toLowerCase();
  if (["false", "no", "none", "not available"].includes(value)) {
    return "DOES_NOT_MATCH";
  }
  if (["true", "yes", "available"].includes(value) || value.length > 0) {
    return "MEETS";
  }
  return "POSSIBLE_GAP";
}

export function forbiddenFundingClaims(): string[] {
  return [
    "NDIS-approved property",
    "NDIS-funded property",
    "suitable for you",
    "SDA eligible",
    "verified property",
    "registered provider",
  ];
}

export function containsForbiddenClaim(text: string): boolean {
  const lower = text.toLowerCase();
  return forbiddenFundingClaims().some((claim) =>
    lower.includes(claim.toLowerCase()),
  );
}
