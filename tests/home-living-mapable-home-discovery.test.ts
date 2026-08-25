import { describe, expect, it } from "vitest";

import {
  containsForbiddenClaim,
  matchRequirementToEvidence,
  normalizeEvidenceStatus,
  publicLocationDisplay,
  toPublicPropertyDetail,
  toPublicPropertySummary,
  type PropertyRow,
} from "@/lib/home-living/evidence/evidence-normalizer";

const baseProperty: PropertyRow = {
  id: "prop-1",
  title: "Example accessible unit",
  addressSummary: "12 Example Street, Suburb",
  suburb: "Suburb",
  state: "NSW",
  locationPrecision: "SUBURB_ONLY",
  propertyType: "apartment",
  bedroomCount: 2,
  bathroomCount: 1,
  sdaCategory: null,
  rentDisplay: "$450 / week",
  availabilityStatus: "available",
  availableFrom: null,
  supportProviderIndependent: true,
  tenancyTermsSummary: null,
  virtualTourUrl: null,
  gaisPlaceId: null,
  relatedSupportOrganisationNote: null,
  vacancies: [
    {
      id: "vac-1",
      label: "Unit 2",
      status: "open",
      availableFrom: null,
      availableTo: null,
    },
  ],
  evidence: [
    {
      feature: "entrance.stepFree",
      value: "true",
      source: "provider",
      verificationStatus: "PROVIDER_SUPPLIED",
      observedAt: new Date("2026-01-01"),
      expiresAt: null,
      disputedAt: null,
    },
  ],
  media: [],
  capabilityProfile: null,
};

describe("MapAble Home evidence normalizer", () => {
  it("keeps missing evidence as UNKNOWN and never invents access", () => {
    expect(
      matchRequirementToEvidence({
        requirement: "roll in shower",
        evidence: [],
      }),
    ).toBe("UNKNOWN");
  });

  it("marks disputed or expired evidence as UNKNOWN for matching", () => {
    const disputed = [
      {
        feature: "entrance.stepFree",
        value: "true",
        source: "provider",
        verificationStatus: "PROVIDER_SUPPLIED",
        observedAt: new Date().toISOString(),
        expiresAt: null,
        disputedAt: new Date().toISOString(),
        displayStatus: "DISPUTED" as const,
      },
    ];
    expect(
      matchRequirementToEvidence({
        requirement: "step free",
        evidence: disputed,
      }),
    ).toBe("UNKNOWN");
  });

  it("normalizes evidence statuses without collapsing to a single verified badge", () => {
    expect(
      normalizeEvidenceStatus({
        verificationStatus: "SOURCE_SUPPLIED",
        expiresAt: null,
        disputedAt: null,
      }),
    ).toBe("PROVIDER_SUPPLIED");
    expect(
      normalizeEvidenceStatus({
        verificationStatus: "PROVIDER_SUPPLIED",
        expiresAt: new Date("2020-01-01"),
        disputedAt: null,
        now: new Date("2026-01-01"),
      }),
    ).toBe("EXPIRED");
  });

  it("respects suburb-only location privacy", () => {
    expect(
      publicLocationDisplay({
        locationPrecision: "SUBURB_ONLY",
        suburb: "Suburb",
        state: "NSW",
        addressSummary: "12 Example Street, Suburb",
      }),
    ).toBe("Suburb, NSW");
  });

  it("distinguishes property summary from vacancy count", () => {
    const summary = toPublicPropertySummary(baseProperty);
    expect(summary.openVacancyCount).toBe(1);
    expect(summary.claimSafetyNote.toLowerCase()).toContain("unknown");
    const detail = toPublicPropertyDetail(baseProperty);
    expect(detail.vacancies).toHaveLength(1);
    expect(detail.unknowns.length).toBeGreaterThan(0);
  });

  it("rejects unsupported funding / suitability claim language", () => {
    expect(containsForbiddenClaim("NDIS-approved property")).toBe(true);
    expect(containsForbiddenClaim("suitable for you")).toBe(true);
    expect(containsForbiddenClaim("Provider supplied entrance width")).toBe(
      false,
    );
  });

  it("does not treat support independence as a suitability score", () => {
    const summary = toPublicPropertySummary({
      ...baseProperty,
      supportProviderIndependent: false,
      relatedSupportOrganisationNote: "Related SIL org noted",
    });
    expect(summary.supportProviderIndependent).toBe(false);
    expect(summary).not.toHaveProperty("suitabilityScore");
  });
});
