import { describe, expect, it } from "vitest";

import {
  ACCESSIMART_DRAFT_CATEGORIES,
  normaliseAccessiMartProductForReview,
} from "@/lib/marketplace/accessimart-review-adapter";

const sourceProduct = {
  id: 17,
  slug: "sample-aac-device",
  name: "  Example AAC device  ",
  description: "Seed catalogue item.",
  condition: "refurbished",
  price: 1000,
  supplierId: 4,
  supplierName: "Example supplier",
  supplierVerified: true,
  quoteRequired: true,
  clinicalReviewRecommended: true,
  repairAvailable: true,
  sparePartsAvailable: false,
  intendedUse: "Communication access",
  accessNeed: "AAC",
  tgaArtgStatus: "ARTG listed",
  ndisGuidance: "NDIS approved",
  contactEmail: "sample@example.test",
  shippingAddress: "Private customer address",
  dropshippingApiKey: "source-secret-not-to-import",
};

describe("AccessiMart ZIP review adapter", () => {
  it("only retains bounded review information, never identity or payment authority", () => {
    const result = normaliseAccessiMartProductForReview(sourceProduct);
    expect(result?.name).toBe("Example AAC device");
    expect(result?.condition).toBe("refurbished");
    expect(result?.assurance).toEqual({
      supplierIdentity: "not-verified",
      productSafety: "not-verified",
      ndisEligibility: "not-assessed",
      provenance: "unreviewed-source",
    });
    expect(result?.commerce).toEqual({
      checkoutAvailable: false,
      quoteSubmissionAvailable: false,
      sellerContactAvailable: false,
    });

    const output = JSON.stringify(result);
    expect(output).not.toContain("sample@example.test");
    expect(output).not.toContain("Private customer address");
    expect(output).not.toContain("source-secret-not-to-import");
    expect(output).not.toContain("supplierVerified");
    expect(output).not.toContain('"price"');
  });

  it("never upgrades source funding or device claims to verified conclusions", () => {
    const result = normaliseAccessiMartProductForReview(sourceProduct);
    expect(result?.sourceClaims.ndisGuidance).toBe("NDIS approved");
    expect(result?.assurance.ndisEligibility).toBe("not-assessed");
    expect(result?.sourceClaims.tgaArtgStatus).toBe("ARTG listed");
    expect(result?.assurance.productSafety).toBe("not-verified");
    expect(result?.source).toBe("user-supplied-accessimart-zip");
  });

  it("rejects invalid input and downgrades an unknown product condition", () => {
    expect(normaliseAccessiMartProductForReview(null)).toBeNull();
    expect(normaliseAccessiMartProductForReview([])).toBeNull();
    expect(
      normaliseAccessiMartProductForReview({ slug: "../bad", name: "Bad" }),
    ).toBeNull();
    expect(
      normaliseAccessiMartProductForReview({ slug: "valid", name: "  " }),
    ).toBeNull();
    expect(
      normaliseAccessiMartProductForReview({
        slug: "valid",
        name: "Unknown condition",
        condition: "not-on-source-enum",
      })?.condition,
    ).toBe("unknown");
  });

  it("tracks the source seed's seven categories without claiming live inventory", () => {
    expect(ACCESSIMART_DRAFT_CATEGORIES).toHaveLength(7);
    expect(
      new Set(ACCESSIMART_DRAFT_CATEGORIES.map((item) => item.slug)).size,
    ).toBe(7);
  });
});
