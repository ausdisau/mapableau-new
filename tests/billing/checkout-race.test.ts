import { beforeEach, describe, expect, it, vi } from "vitest";

const executeRaw = vi.fn();
const findFirst = vi.fn();
const create = vi.fn();
const findUnique = vi.fn();
const paymentUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        $executeRaw: executeRaw,
        billingPayment: { findFirst, create },
      }),
    billingPayment: {
      findUnique,
      update: paymentUpdate,
    },
    billingAccount: {
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ email: "buyer@example.test" }),
    },
  },
}));

vi.mock("@/lib/billing/core/account-service", () => ({
  getOrCreateBillingAccount: vi.fn(),
}));
vi.mock("@/lib/billing/core/audit", () => ({
  writeBillingAuditLog: vi.fn(),
}));
vi.mock("@/lib/billing/core/config", () => ({
  isBillingStripeConfigured: () => true,
}));
vi.mock("@/lib/billing/core/funding-logic", () => ({
  checkoutDecisionForFundingType: () => ({ allowed: true }),
}));
vi.mock("@/lib/billing/core/invoice-service", () => ({
  getInvoiceForUser: vi.fn(),
  updateInvoiceStatus: vi.fn(),
}));
vi.mock("@/lib/stripe/checkout", () => ({
  buildBillingPaymentCheckout: vi.fn(),
}));
vi.mock("@/lib/stripe/client", () => ({
  getStripeClient: vi.fn(() => ({
    checkout: { sessions: { retrieve: vi.fn(), create: vi.fn() } },
    customers: { create: vi.fn() },
  })),
}));

async function mockDraftInvoice() {
  const { getInvoiceForUser } = await import(
    "@/lib/billing/core/invoice-service"
  );
  vi.mocked(getInvoiceForUser).mockResolvedValue({
    id: "inv_1",
    userId: "user_1",
    status: "draft",
    providerId: null,
    totalCents: 1000,
    currency: "AUD",
    transferGroup: null,
    serviceType: "marketplace",
    bookingId: null,
    platformFeeCents: 0,
    fundingSource: { type: "private_card" },
  } as never);
}

describe("checkout payment reservation", () => {
  beforeEach(() => {
    vi.resetModules();
    executeRaw.mockReset();
    findFirst.mockReset();
    create.mockReset();
    findUnique.mockReset();
    paymentUpdate.mockReset();
  });

  it("reuses an in-flight payment without a session id instead of inserting another", async () => {
    const existing = {
      id: "pay_1",
      invoiceId: "inv_1",
      userId: "user_1",
      status: "requires_payment",
      stripeCheckoutSessionId: null,
    };
    findFirst.mockResolvedValue(existing);
    create.mockResolvedValue({ id: "pay_2" });
    findUnique.mockResolvedValue(existing);

    await mockDraftInvoice();
    const { createCheckoutForInvoice } = await import(
      "@/lib/billing/core/checkout-service"
    );

    await createCheckoutForInvoice("user_1", "inv_1").catch(() => undefined);

    expect(executeRaw).toHaveBeenCalled();
    expect(findFirst).toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("does not report a peer-failed payment as already paid", async () => {
    const inFlight = {
      id: "pay_peer",
      invoiceId: "inv_1",
      userId: "user_1",
      status: "requires_payment",
      stripeCheckoutSessionId: null,
    };
    const peerFailed = {
      ...inFlight,
      status: "failed",
      failureReason: "stripe_session_missing_url",
    };
    const replacement = {
      id: "pay_new",
      invoiceId: "inv_1",
      userId: "user_1",
      status: "requires_payment",
      stripeCheckoutSessionId: null,
    };

    // Tab B reserved the same in-flight row; while polling, Tab A marks it
    // failed (e.g. Stripe session missing URL). Replacement must be reserved.
    findFirst
      .mockResolvedValueOnce(inFlight)
      .mockResolvedValueOnce(null);
    create.mockResolvedValue(replacement);
    findUnique.mockResolvedValue(peerFailed);

    await mockDraftInvoice();
    const { getOrCreateBillingAccount } = await import(
      "@/lib/billing/core/account-service"
    );
    const { buildBillingPaymentCheckout } = await import(
      "@/lib/stripe/checkout"
    );
    const { getStripeClient } = await import("@/lib/stripe/client");
    const { updateInvoiceStatus } = await import(
      "@/lib/billing/core/invoice-service"
    );

    vi.mocked(getOrCreateBillingAccount).mockResolvedValue({
      id: "acct_1",
      stripeCustomerId: "cus_1",
    } as never);
    vi.mocked(buildBillingPaymentCheckout).mockResolvedValue({
      id: "cs_test_1",
      url: "https://checkout.stripe.test/pay/cs_test_1",
    } as never);
    vi.mocked(getStripeClient).mockReturnValue({
      checkout: { sessions: { retrieve: vi.fn(), create: vi.fn() } },
      customers: { create: vi.fn() },
    } as never);
    vi.mocked(updateInvoiceStatus).mockResolvedValue(undefined as never);
    paymentUpdate.mockResolvedValue({});

    const { createCheckoutForInvoice } = await import(
      "@/lib/billing/core/checkout-service"
    );
    const result = await createCheckoutForInvoice("user_1", "inv_1");

    expect(result).toMatchObject({
      ok: true,
      checkoutUrl: "https://checkout.stripe.test/pay/cs_test_1",
      sessionId: "cs_test_1",
    });
    expect(result).not.toMatchObject({
      error: expect.stringMatching(/already succeeded/i),
    });
    expect(create).toHaveBeenCalled();
  });
});
