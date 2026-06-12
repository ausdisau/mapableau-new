import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCustomerPortalSession } from "@/lib/billing-core/portal-service";

vi.mock("@/lib/billing-core/config", () => ({
  billingCoreConfig: { appUrl: "https://app.example" },
  isBillingStripeConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/billing-core/account-service", () => ({
  getOrCreateBillingAccount: vi.fn(),
  ensureStripeCustomerForUser: vi.fn(),
}));

vi.mock("@/lib/billing-core/audit", () => ({
  writeBillingAuditLog: vi.fn(),
}));

vi.mock("@/lib/stripe/portal", () => ({
  createBillingPortalSession: vi.fn(),
}));

const { isBillingStripeConfigured } = await import("@/lib/billing-core/config");
const {
  getOrCreateBillingAccount,
  ensureStripeCustomerForUser,
} = await import("@/lib/billing-core/account-service");
const { createBillingPortalSession } = await import("@/lib/stripe/portal");

describe("createCustomerPortalSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when Stripe is not configured", async () => {
    vi.mocked(isBillingStripeConfigured).mockReturnValue(false);

    const result = await createCustomerPortalSession({ userId: "u1" });

    expect(result).toEqual({ ok: false, error: "Stripe is not configured" });
  });

  it("returns error when no customer and createCustomerIfMissing is false", async () => {
    vi.mocked(isBillingStripeConfigured).mockReturnValue(true);
    vi.mocked(getOrCreateBillingAccount).mockResolvedValue({
      id: "acct1",
      stripeCustomerId: null,
    } as never);

    const result = await createCustomerPortalSession({ userId: "u1" });

    expect(result).toEqual({ ok: false, error: "No billing customer on file" });
    expect(ensureStripeCustomerForUser).not.toHaveBeenCalled();
  });

  it("creates customer when missing and createCustomerIfMissing is true", async () => {
    vi.mocked(isBillingStripeConfigured).mockReturnValue(true);
    vi.mocked(getOrCreateBillingAccount).mockResolvedValue({
      id: "acct1",
      stripeCustomerId: null,
    } as never);
    vi.mocked(ensureStripeCustomerForUser).mockResolvedValue({
      id: "acct1",
      stripeCustomerId: "cus_new",
    } as never);
    vi.mocked(createBillingPortalSession).mockResolvedValue({
      url: "https://billing.stripe.com/session/test",
    } as never);

    const result = await createCustomerPortalSession({
      userId: "u1",
      createCustomerIfMissing: true,
    });

    expect(ensureStripeCustomerForUser).toHaveBeenCalledWith("u1", "participant");
    expect(createBillingPortalSession).toHaveBeenCalledWith({
      stripeCustomerId: "cus_new",
      returnUrl: "https://app.example/dashboard/billing/invoices",
    });
    expect(result).toEqual({
      ok: true,
      portalUrl: "https://billing.stripe.com/session/test",
    });
  });

  it("uses custom returnUrl when provided", async () => {
    vi.mocked(isBillingStripeConfigured).mockReturnValue(true);
    vi.mocked(getOrCreateBillingAccount).mockResolvedValue({
      id: "acct1",
      stripeCustomerId: "cus_existing",
    } as never);
    vi.mocked(createBillingPortalSession).mockResolvedValue({
      url: "https://billing.stripe.com/session/custom",
    } as never);

    const result = await createCustomerPortalSession({
      userId: "u1",
      returnUrl: "https://app.example/abilitypay/payment-methods",
    });

    expect(createBillingPortalSession).toHaveBeenCalledWith({
      stripeCustomerId: "cus_existing",
      returnUrl: "https://app.example/abilitypay/payment-methods",
    });
    expect(result.ok).toBe(true);
  });
});
