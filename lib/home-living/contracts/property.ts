/**
 * MapAble Home discovery contracts.
 * Properties are NOT MarketplaceProduct records.
 * Evidence must never collapse into a single "accessible" / "verified" badge.
 */

export const EVIDENCE_STATUSES = [
  "VERIFIED",
  "PROVIDER_SUPPLIED",
  "COMMUNITY_REPORTED",
  "MAPABLE_VERIFIED",
  "EXPIRED",
  "DISPUTED",
  "UNKNOWN",
] as const;

export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

/** Aligns with AccessibleProperty.locationPrecision values. */
export const LOCATION_PRECISIONS = [
  "SUBURB_ONLY",
  "APPROXIMATE",
  "STREET",
  "FULL_ADDRESS",
] as const;

export type LocationPrecision = (typeof LOCATION_PRECISIONS)[number];

export const REQUIREMENT_MATCH_STATES = [
  "MEETS",
  "DOES_NOT_MATCH",
  "UNKNOWN",
  "POSSIBLE_GAP",
] as const;

export type RequirementMatchState =
  (typeof REQUIREMENT_MATCH_STATES)[number];

export type PublicPropertySummary = {
  id: string;
  title: string;
  suburb: string | null;
  state: string | null;
  locationPrecision: string;
  propertyType: string;
  bedroomCount: number | null;
  bathroomCount: number | null;
  sdaCategory: string | null;
  rentDisplay: string | null;
  availabilityStatus: string;
  availableFrom: string | null;
  supportProviderIndependent: boolean;
  openVacancyCount: number;
  evidenceFeatureCount: number;
  /** Never a suitability score. */
  claimSafetyNote: string;
};

export type PublicEvidenceItem = {
  feature: string;
  value: string;
  source: string;
  verificationStatus: string;
  observedAt: string;
  expiresAt: string | null;
  disputedAt: string | null;
  displayStatus: EvidenceStatus;
};

export type PublicPropertyDetail = PublicPropertySummary & {
  addressDisplay: string;
  tenancyTermsSummary: string | null;
  virtualTourUrl: string | null;
  gaisPlaceId: string | null;
  relatedSupportOrganisationNote: string | null;
  evidence: PublicEvidenceItem[];
  vacancies: Array<{
    id: string;
    label: string | null;
    status: string;
    availableFrom: string | null;
    availableTo: string | null;
  }>;
  media: Array<{
    id: string;
    kind: string;
    url: string;
    altText: string | null;
    caption: string | null;
  }>;
  capabilities: Array<{
    key: string;
    value: unknown;
    source: string;
    verificationStatus: string;
  }>;
  unknowns: string[];
};

export type PropertySearchFilters = {
  suburb?: string;
  propertyType?: string;
  bedroomCount?: number;
  availabilityStatus?: string;
  sdaCategory?: string;
  accessibilityFeatures?: string[];
  limit?: number;
};

export type ComparisonRow = {
  featureLabel: string;
  values: Array<{
    propertyId: string;
    display: string;
    matchState: RequirementMatchState;
  }>;
};
