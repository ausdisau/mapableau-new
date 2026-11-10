import { describe, expect, it } from "vitest";

import {
  CRIPSQUARE_BOUNDARY_POLICY,
  createCripSquareListingReference,
} from "@/lib/ecosystem/cripsquare-integration-contract";
import {
  handoffRequiresConfirmation,
  suggestChallengeDiscoveryHandoffs,
} from "@/lib/ecosystem/handoff-contracts";
import {
  ECOSYSTEM_JOURNEYS,
  ECOSYSTEM_PRIMARY_NAV,
  ECOSYSTEM_SERVICES,
  getEcosystemService,
  isKnownEcosystemHref,
} from "@/lib/ecosystem/service-directory";

describe("ecosystem service directory", () => {
  it("exposes the primary hub choices", () => {
    expect(ECOSYSTEM_PRIMARY_NAV.map((item) => item.label)).toEqual([
      "Explore",
      "Marketplace",
      "Community",
      "Challenges",
      "My Day",
      "Care",
      "Transport",
      "Employment",
    ]);
  });

  it("keeps every service href known, external, or null", () => {
    for (const service of ECOSYSTEM_SERVICES) {
      expect(isKnownEcosystemHref(service.href)).toBe(true);
    }
  });

  it("only references declared service ids in journeys", () => {
    const ids = new Set(ECOSYSTEM_SERVICES.map((service) => service.id));
    for (const journey of ECOSYSTEM_JOURNEYS) {
      for (const serviceId of journey.serviceIds) {
        expect(ids.has(serviceId)).toBe(true);
        expect(() => getEcosystemService(serviceId)).not.toThrow();
      }
    }
  });

  it("marks Day and CripSquare as planned without broken hrefs", () => {
    expect(getEcosystemService("day")).toMatchObject({
      state: "planned",
      href: null,
    });
    expect(getEcosystemService("cripsquare")).toMatchObject({
      state: "planned",
      href: null,
    });
  });
});

describe("ecosystem handoff contracts", () => {
  it("suggests confirm-only challenge discovery steps without mutations", () => {
    const handoffs = suggestChallengeDiscoveryHandoffs({
      challengeId: "challenge-station-entrance",
      barrierSummary: "Inaccessible railway station entrance",
      evidenceStatus: "unverified-report",
    });
    expect(handoffs.length).toBeGreaterThanOrEqual(5);
    for (const handoff of handoffs) {
      expect(handoffRequiresConfirmation(handoff)).toBe(true);
      expect(handoff.confirmationRequired).toBe(true);
      expect(handoff.sourceRecordId).toBe("challenge-station-entrance");
    }
  });
});

describe("CripSquare boundary contract", () => {
  it("forbids private content import and core-service prerequisites", () => {
    expect(CRIPSQUARE_BOUNDARY_POLICY.federationEnabled).toBe(false);
    expect(CRIPSQUARE_BOUNDARY_POLICY.mayImportPosts).toBe(false);
    expect(CRIPSQUARE_BOUNDARY_POLICY.mayImportDirectMessages).toBe(false);
    expect(CRIPSQUARE_BOUNDARY_POLICY.communityPrerequisiteForCoreServices).toBe(
      false,
    );
    expect(CRIPSQUARE_BOUNDARY_POLICY.sellerEndorsementFromForum).toBe(false);

    const reference = createCripSquareListingReference({
      kind: "marketplace-listing",
      mapableRecordId: "listing-1",
      displayTitle: "Example listing",
      evidenceStatus: "synthetic",
    });
    expect(reference.importsPrivateContent).toBe(false);
    expect(reference.requiredForCoreServices).toBe(false);
  });
});
