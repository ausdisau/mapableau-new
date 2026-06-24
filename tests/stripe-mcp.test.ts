import { describe, expect, it } from "vitest";

import {
  buildCheckoutMetadataPreview,
  evaluateFundingCheckout,
  getStripeConfigurationStatus,
  mapableBillingApiReference,
  STRIPE_MCP_GOVERNANCE,
} from "@/lib/stripe/mcp-reference";

describe("Stripe MCP reference helpers", () => {
  it("exposes governance version", () => {
    expect(STRIPE_MCP_GOVERNANCE.name).toBe("mapable-stripe");
    expect(STRIPE_MCP_GOVERNANCE.version).toBeTruthy();
  });

  it("reports sdk unavailable without STRIPE_SECRET_KEY", () => {
    const status = getStripeConfigurationStatus();
    expect(status.env.STRIPE_SECRET_KEY).toBe("missing");
    expect(status.sdkAvailable).toBe(false);
  });

  it("blocks plan-managed funding from Stripe Checkout", () => {
    const result = evaluateFundingCheckout("ndis_plan_managed");
    expect(result.stripeCheckoutAllowed).toBe(false);
    expect(result.decision.allowed).toBe(false);
    if (!result.decision.allowed) {
      expect(result.decision.reason).toBe("plan_managed");
    }
  });

  it("allows self-managed and private card checkout", () => {
    expect(evaluateFundingCheckout("ndis_self_managed").stripeCheckoutAllowed).toBe(
      true
    );
    expect(evaluateFundingCheckout("private_card").stripeCheckoutAllowed).toBe(true);
  });

  it("builds billing-core metadata with stable keys", () => {
    const metadata = buildCheckoutMetadataPreview({
      mode: "billing",
      invoiceId: "inv_1",
      userId: "user_1",
      serviceType: "care",
      bookingId: "book_1",
    });
    expect(metadata).toEqual({
      invoiceId: "inv_1",
      userId: "user_1",
      mapableUserId: "user_1",
      serviceType: "care",
      bookingId: "book_1",
    });
  });

  it("builds legacy metadata with payment purpose", () => {
    const metadata = buildCheckoutMetadataPreview({
      mode: "legacy",
      invoiceId: "inv_2",
      userId: "user_2",
      purpose: "participant_private_pay",
    });
    expect(metadata.mapable_invoice_id).toBe("inv_2");
    expect(metadata.payment_purpose).toBe("participant_private_pay");
  });

  it("lists MapAble billing API endpoints", () => {
    const ref = mapableBillingApiReference("http://localhost:3000");
    expect(ref.baseUrl).toBe("http://localhost:3000");
    expect(ref.endpoints.some((e) => e.path === "/api/billing/checkout")).toBe(true);
    expect(ref.webhookEvents).toContain("checkout.session.completed");
  });
});
