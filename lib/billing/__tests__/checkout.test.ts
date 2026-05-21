import type { FundingSource, Invoice } from "@prisma/client";
import { describe, it, expect } from "vitest";

import { assertCheckoutAllowed } from "@/lib/billing/checkout";

function mockInvoice(
  fundingType: FundingSource["type"] | null
): Invoice & { fundingSource: FundingSource | null } {
  return {
    id: "inv_test",
    userId: "user_test",
    providerId: null,
    bookingId: null,
    serviceType: "care",
    status: "issued",
    fundingSourceId: fundingType ? "fs_test" : null,
    currency: "AUD",
    subtotalCents: 10000,
    platformFeeCents: 500,
    gstCents: 0,
    totalCents: 10500,
    ndisLineItem: null,
    ndisClaimable: false,
    stripeCheckoutSessionId: null,
    stripePaymentIntentId: null,
    stripeInvoiceId: null,
    xeroExportStatus: null,
    planManagerExportStatus: null,
    dueAt: null,
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    fundingSource: fundingType
      ? ({
          id: "fs_test",
          userId: "user_test",
          type: fundingType,
          label: "Test",
          ndisParticipantNumber: null,
          planManagerName: null,
          planManagerEmail: null,
          isDefault: true,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        } as FundingSource)
      : null,
  };
}

describe("assertCheckoutAllowed", () => {
  it("throws for plan-managed funding", () => {
    expect(() =>
      assertCheckoutAllowed(mockInvoice("ndis_plan_managed"))
    ).toThrow("PLAN_MANAGED_NO_STRIPE");
  });

  it("allows self-managed funding", () => {
    expect(() =>
      assertCheckoutAllowed(mockInvoice("ndis_self_managed"))
    ).not.toThrow();
  });

  it("allows private card funding", () => {
    expect(() =>
      assertCheckoutAllowed(mockInvoice("private_card"))
    ).not.toThrow();
  });
});
