import { describe, expect, it } from "vitest";

import { normaliseAccessiMartProductForReview } from "@/lib/marketplace/accessimart-review-adapter";
import {
  ACCESSIMART_SYNTHETIC_CATALOGUE,
  getAccessiMartReviewListing,
  listAccessiMartReviewListings,
} from "@/lib/marketplace/accessimart-synthetic-catalogue";
import {
  ACCESSIMART_EXCLUDED_SURFACES,
  ACCESSIMART_PROVENANCE,
} from "@/lib/marketplace/accessimart-provenance";

describe("AccessiMart review adapter", () => {
  it("normalises a valid seed-shaped row and preserves source id", () => {
    const listing = normaliseAccessiMartProductForReview({
      id: 42,
      slug: "example-reacher",
      name: "Example reacher",
      description: "Test",
      condition: "new",
      quoteRequired: true,
      clinicalReviewRecommended: true,
      repairAvailable: true,
      sparePartsAvailable: false,
      intendedUse: "Reach",
      accessNeed: "Grip",
      supportCategory: "Daily living",
      tgaArtgStatus: "ARTG listed",
      ndisGuidance: "May be discussed",
      warrantyPeriod: "12 months",
      safetyNotes: "Check grip",
      inspectionDate: "2026-05-01",
      setupComplexity: "simple",
      categorySlug: "daily-living-aids",
      supplier: {
        id: 9,
        legalName: "Example Supplier",
        tradingName: "Example",
        verificationStatus: "verified",
        warrantyPolicy: "12 months",
        repairPolicy: "Workshop",
      },
    });

    expect(listing).not.toBeNull();
    expect(listing?.sourceId).toBe("42");
    expect(listing?.slug).toBe("example-reacher");
    expect(listing?.assurance.supplierIdentity).toBe("not-verified");
    expect(listing?.assurance.productSafety).toBe("not-verified");
    expect(listing?.assurance.ndisEligibility).toBe("not-assessed");
    expect(listing?.assurance.warranty).toBe("not-verified");
    expect(listing?.supplier?.identityAssurance).toBe("not-verified");
    expect(listing?.commerce.checkoutAvailable).toBe(false);
    expect(listing?.commerce.quoteSubmissionAvailable).toBe(false);
    expect(listing?.commerce.sellerContactAvailable).toBe(false);
    expect(listing?.lastVerifiedAt).toBe("2026-05-01");
  });

  it("rejects invalid slugs and non-objects", () => {
    expect(
      normaliseAccessiMartProductForReview({
        slug: "Bad Slug",
        name: "Nope",
      }),
    ).toBeNull();
    expect(normaliseAccessiMartProductForReview(null)).toBeNull();
    expect(normaliseAccessiMartProductForReview("x")).toBeNull();
  });

  it("downgrades seed verified suppliers in synthetic catalogue", () => {
    expect(ACCESSIMART_SYNTHETIC_CATALOGUE.length).toBeGreaterThan(0);
    for (const listing of ACCESSIMART_SYNTHETIC_CATALOGUE) {
      expect(listing.assurance.supplierIdentity).toBe("not-verified");
      expect(listing.commerce.checkoutAvailable).toBe(false);
      expect(listing.commerce.illustrativePriceShown).toBe(false);
      expect(listing.sourceId.length).toBeGreaterThan(0);
    }
  });

  it("filters listings and resolves by slug", () => {
    const mobility = listAccessiMartReviewListings({
      categorySlug: "mobility-seating",
    });
    expect(mobility.every((item) => item.categorySlug === "mobility-seating")).toBe(
      true,
    );
    const item = getAccessiMartReviewListing(
      "karma-ergo-lite-2-manual-wheelchair",
    );
    expect(item?.sourceId).toBe("1");
  });

  it("records provenance pin and exclusions", () => {
    expect(ACCESSIMART_PROVENANCE.gitCommitSha).toBe(
      "d6b0dc7891e92b5063252f015d4eb02fa667bde9",
    );
    expect(ACCESSIMART_EXCLUDED_SURFACES.some((s) => s.includes("/admin"))).toBe(
      true,
    );
  });
});
