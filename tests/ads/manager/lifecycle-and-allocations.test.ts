import { describe, expect, it } from "vitest";

import {
  AllocationValidationError,
  assertAllocationsWithinBudget,
  sumAllocationCaps,
} from "@/lib/ads/manager/allocations";
import {
  assertLifecycleTransition,
  ForbiddenLifecycleTransitionError,
} from "@/lib/ads/manager/lifecycle";
import { formatAudMinor } from "@/lib/ads/money/minor";
import {
  assertNoSensitiveTargeting,
  hardFilterCandidate,
  rankEligible,
  type PlacementCandidate,
} from "@/lib/ads/placement/eligibility";

describe("manager lifecycle", () => {
  it("allows draft to awaiting_review", () => {
    expect(() =>
      assertLifecycleTransition("DRAFT", "AWAITING_REVIEW"),
    ).not.toThrow();
  });

  it("rejects forbidden transitions", () => {
    expect(() => assertLifecycleTransition("DRAFT", "ACTIVE")).toThrow(
      ForbiddenLifecycleTransitionError,
    );
  });

  it("rejects closed transitions out", () => {
    expect(() => assertLifecycleTransition("CLOSED", "DRAFT")).toThrow(
      ForbiddenLifecycleTransitionError,
    );
  });
});

describe("allocations", () => {
  it("accepts caps within budget", () => {
    expect(() =>
      assertAllocationsWithinBudget(150000, [
        { channel: "mapable", capMinor: 50000 },
        { channel: "dooh", capMinor: 100000 },
      ]),
    ).not.toThrow();
    expect(
      sumAllocationCaps([
        { channel: "mapable", capMinor: 50000 },
        { channel: "dooh", capMinor: 100000 },
      ]),
    ).toBe(150000);
  });

  it("rejects over-allocation and duplicates", () => {
    expect(() =>
      assertAllocationsWithinBudget(100, [
        { channel: "mapable", capMinor: 60 },
        { channel: "dooh", capMinor: 50 },
      ]),
    ).toThrow(AllocationValidationError);
    expect(() =>
      assertAllocationsWithinBudget(100, [
        { channel: "mapable", capMinor: 40 },
        { channel: "mapable", capMinor: 40 },
      ]),
    ).toThrow(AllocationValidationError);
  });
});

describe("placement eligibility", () => {
  const base: PlacementCandidate = {
    opportunityId: "o1",
    channel: "mapable",
    providerId: "mapable-owned",
    externalInventoryId: "access.map.sponsored-card",
    inventoryType: "owned",
    geoRegion: "AU-NSW",
    availabilityState: "indicative",
    inventorySource: "fixture",
    sourceObservedAt: new Date().toISOString(),
    buyingMode: "owned_reservation",
    currency: "AUD",
    minimumSpendMinor: 1000,
    priceEstimateMinor: 5000,
    formatSpecs: { formats: ["image"], aspectRatio: "16:9" },
    commercialAuthorityState: "demo",
    reasonsEligible: [],
  };

  it("blocks sensitive targeting keys", () => {
    expect(() =>
      assertNoSensitiveTargeting({
        targeting: { kind: "contextual" },
        // @ts-expect-error intentional abuse payload
        diagnosis: "hidden",
      }),
    ).toThrow(/Sensitive targeting/);
  });

  it("excludes stale and region mismatches", () => {
    const stale = hardFilterCandidate(
      {
        ...base,
        sourceObservedAt: "2020-01-01T00:00:00.000Z",
        geoRegion: "US",
      },
      { region: { country: "AU" }, budget: { amountMinor: 10000, currency: "AUD" } },
    );
    expect(stale.ok).toBe(false);
    if (!stale.ok) {
      expect(stale.reasonCodes).toContain("STALE_INVENTORY");
      expect(stale.reasonCodes).toContain("REGION_MISMATCH");
    }
  });

  it("ranks without requiring disability signals", () => {
    const ranked = rankEligible(
      [
        { ...base, opportunityId: "cheap", priceEstimateMinor: 1000 },
        { ...base, opportunityId: "dear", priceEstimateMinor: 9000 },
      ],
      { budget: { amountMinor: 10000, currency: "AUD" } },
    );
    expect(ranked[0]?.opportunityId).toBe("cheap");
  });
});

describe("minor money", () => {
  it("formats cents", () => {
    expect(formatAudMinor(150050)).toBe("A$1500.50");
  });
});
