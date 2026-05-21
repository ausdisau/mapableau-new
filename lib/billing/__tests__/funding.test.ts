import { describe, it, expect } from "vitest";

import {
  blocksStripeCheckout,
  requiresStripeCheckout,
  resolveCheckoutDecision,
  isPlanManagedFunding,
} from "@/lib/billing/funding";

describe("funding source decision logic", () => {
  it("identifies plan-managed funding", () => {
    expect(isPlanManagedFunding("ndis_plan_managed")).toBe(true);
    expect(isPlanManagedFunding("private_card")).toBe(false);
  });

  it("blocks Stripe checkout for plan-managed", () => {
    expect(blocksStripeCheckout("ndis_plan_managed")).toBe(true);
    expect(blocksStripeCheckout("ndis_self_managed")).toBe(false);
  });

  it("allows checkout for self-managed and private card", () => {
    expect(requiresStripeCheckout("ndis_self_managed")).toBe(true);
    expect(requiresStripeCheckout("private_card")).toBe(true);
    expect(requiresStripeCheckout("organisation_invoice")).toBe(false);
  });

  it("returns plan_manager_export for plan-managed checkout decision", () => {
    const decision = resolveCheckoutDecision("ndis_plan_managed");
    expect(decision.action).toBe("plan_manager_export");
  });

  it("returns stripe_checkout for self-managed", () => {
    const decision = resolveCheckoutDecision("ndis_self_managed");
    expect(decision.action).toBe("stripe_checkout");
  });

  it("checkout blocked for plan-managed invoices", () => {
    expect(blocksStripeCheckout("ndis_plan_managed")).toBe(true);
    const d = resolveCheckoutDecision("ndis_plan_managed");
    expect(d.action).not.toBe("stripe_checkout");
  });

  it("checkout allowed for self-managed and private", () => {
    expect(blocksStripeCheckout("ndis_self_managed")).toBe(false);
    expect(resolveCheckoutDecision("ndis_self_managed").action).toBe(
      "stripe_checkout"
    );
    expect(resolveCheckoutDecision("private_card").action).toBe(
      "stripe_checkout"
    );
  });
});
