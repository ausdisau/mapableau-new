import { describe, expect, it, vi, beforeEach } from "vitest";

const executeRaw = vi.fn();
const findFirst = vi.fn();
const create = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        $executeRaw: executeRaw,
        billingPayment: { findFirst, create },
      }),
    billingPayment: {
      findUnique: vi.fn(),
      update: vi.fn(),
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

describe("checkout payment reservation", () => {
  beforeEach(() => {
    executeRaw.mockReset();
    findFirst.mockReset();
    create.mockReset();
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

    // Import after mocks.
    const { createCheckoutForInvoice } = await import(
      "@/lib/billing/core/checkout-service"
    );
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

    // Force early return after reserve by marking Stripe unconfigured path —
    // assert create was not called when findFirst returns an in-flight row.
    findFirst.mockResolvedValue(existing);
    create.mockResolvedValue({ id: "pay_2" });

    // Call reserve path indirectly: createCheckoutForInvoice will reserve then
    // attempt Stripe; stub invoice paid to stop before Stripe if needed.
    // Here we only exercise the transaction client behaviour via a second import
    // of the module's internal path by invoking createCheckout and ensuring
    // billingPayment.create is not used when an open payment already exists.
    await createCheckoutForInvoice("user_1", "inv_1").catch(() => undefined);

    expect(executeRaw).toHaveBeenCalled();
    expect(findFirst).toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});
