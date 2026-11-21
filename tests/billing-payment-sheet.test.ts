import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/billing/core/account-service", () => ({
  getOrCreateBillingAccount: vi.fn(),
}));
vi.mock("@/lib/billing/core/audit", () => ({
  writeBillingAuditLog: vi.fn(),
}));
vi.mock("@/lib/billing/core/config", () => ({
  isBillingStripeConfigured: vi.fn(),
}));
vi.mock("@/lib/billing/core/invoice-service", () => ({
  getInvoiceForUser: vi.fn(),
  updateInvoiceStatus: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    billingAccount: { update: vi.fn(), findFirst: vi.fn() },
    billingPayment: { create: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("@/lib/stripe/client", () => ({
  STRIPE_API_VERSION: "2026-05-27.dahlia",
  getStripeClient: vi.fn(),
}));

import { getOrCreateBillingAccount } from "@/lib/billing/core/account-service";
import { isBillingStripeConfigured } from "@/lib/billing/core/config";
import { getInvoiceForUser, updateInvoiceStatus } from "@/lib/billing/core/invoice-service";
import { createPaymentSheetForInvoice } from "@/lib/billing/core/payment-sheet-service";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe/client";

const mockedConfigured = vi.mocked(isBillingStripeConfigured);
const mockedGetInvoice = vi.mocked(getInvoiceForUser);
const mockedGetAccount = vi.mocked(getOrCreateBillingAccount);
const mockedGetStripe = vi.mocked(getStripeClient);
const mockedUpdateStatus = vi.mocked(updateInvoiceStatus);

describe("createPaymentSheetForInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses plan-managed funding without calling Stripe", async () => {
    mockedGetInvoice.mockResolvedValue({
      id: "inv_1",
      fundingSource: { type: "ndis_plan_managed" },
    } as never);
    mockedConfigured.mockReturnValue(true);

    const result = await createPaymentSheetForInvoice("user_1", "inv_1");
    expect(result.ok).toBe(false);
    if (!result.ok && "decision" in result) {
      expect(result.decision.allowed).toBe(false);
      if (!result.decision.allowed) {
        expect(result.decision.reason).toBe("plan_managed");
      }
    }
    expect(mockedGetStripe).not.toHaveBeenCalled();
  });

  it("returns configured:false when Stripe is off", async () => {
    mockedGetInvoice.mockResolvedValue({
      id: "inv_1",
      fundingSource: { type: "ndis_self_managed" },
    } as never);
    mockedConfigured.mockReturnValue(false);

    const result = await createPaymentSheetForInvoice("user_1", "inv_1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not configured/i);
      expect("configured" in result && result.configured).toBe(false);
    }
  });

  it("creates PaymentIntent + ephemeral key for self-managed invoices", async () => {
    mockedConfigured.mockReturnValue(true);
    mockedGetInvoice.mockResolvedValue({
      id: "inv_1",
      userId: "user_1",
      providerId: null,
      serviceType: "care",
      bookingId: null,
      transferGroup: null,
      totalCents: 5000,
      currency: "AUD",
      platformFeeCents: 0,
      fundingSource: { type: "private_pay" },
    } as never);
    mockedGetAccount.mockResolvedValue({
      id: "ba_1",
      stripeCustomerId: "cus_existing",
    } as never);
    (prisma.billingAccount.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      null
    );
    (prisma.billingPayment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "pay_1",
    });
    (prisma.billingPayment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    mockedUpdateStatus.mockResolvedValue(undefined as never);

    const paymentIntentsCreate = vi.fn().mockResolvedValue({
      id: "pi_1",
      client_secret: "pi_1_secret",
    });
    const ephemeralKeysCreate = vi.fn().mockResolvedValue({
      secret: "ek_test_secret",
    });
    mockedGetStripe.mockReturnValue({
      paymentIntents: { create: paymentIntentsCreate },
      ephemeralKeys: { create: ephemeralKeysCreate },
    } as never);

    const result = await createPaymentSheetForInvoice("user_1", "inv_1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.customerId).toBe("cus_existing");
      expect(result.ephemeralKey).toBe("ek_test_secret");
      expect(result.paymentIntentClientSecret).toBe("pi_1_secret");
      expect(result.paymentId).toBe("pay_1");
    }
    expect(paymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 5000,
        automatic_payment_methods: { enabled: true },
        customer: "cus_existing",
      })
    );
    expect(ephemeralKeysCreate).toHaveBeenCalled();
  });
});
