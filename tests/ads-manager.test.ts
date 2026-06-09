import { describe, expect, it } from "vitest";

import { isCampaignSchedulable } from "@/lib/ads/campaign-service";
import { getAdsCampaignPackageCents } from "@/lib/ads/config";
import {
  validateAdCopy,
  validateAdvertiserCategory,
  validateCampaignForSubmit,
  validateTargetingObject,
} from "@/lib/ads/policy-validation";
import {
  adTargetingSchema,
  SENSITIVE_TARGETING_KEYS,
} from "@/lib/ads/schemas";

describe("ad targeting schema", () => {
  it("accepts allowed contextual targeting", () => {
    const result = adTargetingSchema.safeParse({
      placements: ["skyscraper_left"],
      states: ["NSW"],
      pageContexts: ["provider_finder"],
      deviceTypes: ["desktop"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown keys via strict mode", () => {
    const result = adTargetingSchema.safeParse({
      placements: ["sponsored_provider_card"],
      diagnosis: ["autism"],
    });
    expect(result.success).toBe(false);
  });

  it("documents sensitive keys list", () => {
    expect(SENSITIVE_TARGETING_KEYS).toContain("ndisPlanValue");
  });
});

describe("ad policy validation", () => {
  it("flags banned copy", () => {
    const result = validateAdCopy({
      headline: "Miracle cure for NDIS participants",
      body: "",
      altText: "Promotional banner for services",
      ctaLabel: "Learn more",
    });
    expect(result.passed).toBe(false);
  });

  it("requires meaningful alt text", () => {
    const result = validateAdCopy({
      headline: "Quality supports",
      altText: "short",
      ctaLabel: "Enquire",
    });
    expect(result.passed).toBe(false);
  });

  it("rejects sensitive targeting keys", () => {
    const result = validateTargetingObject({
      placements: ["banner_inline"],
      participantProfile: { age: 12 },
    });
    expect(result.passed).toBe(false);
  });

  it("allows verified advertiser categories", () => {
    const result = validateAdvertiserCategory("ndis_provider");
    expect(result.passed).toBe(true);
  });
});

describe("campaign submit validation", () => {
  it("requires creatives", () => {
    const result = validateCampaignForSubmit({
      name: "Test",
      category: "ndis_provider",
      targeting: { placements: ["skyscraper_right"] },
      creatives: [],
    });
    expect(result.passed).toBe(false);
  });
});

describe("campaign schedulable guard", () => {
  it("is not live without paid invoice", () => {
    expect(
      isCampaignSchedulable({
        status: "approved",
        startAt: null,
        endAt: null,
        billingInvoice: { status: "pending_payment" },
      })
    ).toBe(false);
  });

  it("is live when approved, paid, and in schedule", () => {
    expect(
      isCampaignSchedulable({
        status: "active",
        startAt: new Date(Date.now() - 86400000),
        endAt: new Date(Date.now() + 86400000),
        billingInvoice: { status: "paid" },
      })
    ).toBe(true);
  });
});

describe("ads config", () => {
  it("has default package cents", () => {
    expect(getAdsCampaignPackageCents()).toBeGreaterThan(0);
  });
});
