import { describe, expect, it, vi } from "vitest";

import { calculateInvoiceTotals } from "@/lib/billing-core/calculations";
import { enrollmentProductConfig } from "@/lib/monetization/enrollment-checkout-service";

describe("monetization spine", () => {
  it("applies platform fee to booking bridge totals", () => {
    const totals = calculateInvoiceTotals([
      { quantity: 1, unitAmountCents: 12000, gstApplicable: false },
    ]);
    expect(totals.subtotalCents).toBe(12000);
    expect(totals.platformFeeCents).toBe(1200);
    expect(totals.totalCents).toBe(13200);
  });

  it("maps marketplace featured plan in stripe config", async () => {
    vi.stubEnv("STRIPE_MARKETPLACE_FEATURED_PRICE_ID", "price_marketplace_test");
    vi.resetModules();
    const { priceIdForSubscriptionPlan } = await import("@/lib/stripe/config");
    expect(priceIdForSubscriptionPlan("marketplace_featured")).toBe(
      "price_marketplace_test",
    );
    vi.unstubAllEnvs();
  });

  it("defines enrollment product amounts", () => {
    expect(enrollmentProductConfig("provider_academy").amountCents).toBeGreaterThan(0);
    expect(enrollmentProductConfig("partner_api_program").amountCents).toBeGreaterThan(
      enrollmentProductConfig("provider_academy").amountCents,
    );
  });
});
