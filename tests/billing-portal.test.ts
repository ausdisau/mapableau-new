import { describe, expect, it } from "vitest";

import { billingNavLinksForRole } from "@/components/billing/billing-nav";
import { billingAccountRoleForUserRole } from "@/lib/billing/core/billing-role";
import { checkoutDecisionForFundingType } from "@/lib/billing/core/funding-logic";
import { pickBillingAccountForPortal } from "@/lib/billing/core/portal-account";
import {
  canIssueInvoiceFromStatus,
  canSendInvoiceFromStatus,
  canVoidInvoiceFromStatus,
  isInvoicePayable,
  isInvoiceSettled,
} from "@/lib/billing/portal-gating";
import {
  billingInvoiceCheckoutReturnUrls,
  checkoutIntegrationIdentifier,
} from "@/lib/stripe/integration-identifier";
import { billingPortalReturnUrl } from "@/lib/stripe/portal";

describe("portal Stripe customer selection", () => {
  it("prefers the account matching the caller billing role", () => {
    const picked = pickBillingAccountForPortal(
      [
        { role: "provider", stripeCustomerId: "cus_provider" },
        { role: "participant", stripeCustomerId: "cus_participant" },
      ],
      "participant"
    );
    expect(picked?.stripeCustomerId).toBe("cus_participant");
  });

  it("falls back to any linked customer", () => {
    const picked = pickBillingAccountForPortal(
      [
        { role: "provider", stripeCustomerId: null },
        { role: "employer", stripeCustomerId: "cus_employer" },
      ],
      "participant"
    );
    expect(picked?.stripeCustomerId).toBe("cus_employer");
  });

  it("returns null when no Stripe customer exists", () => {
    expect(
      pickBillingAccountForPortal(
        [{ role: "participant", stripeCustomerId: null }],
        "participant"
      )
    ).toBeNull();
  });

  it("maps provider_admin to the provider billing account role", () => {
    expect(billingAccountRoleForUserRole("provider_admin")).toBe("provider");
    expect(billingAccountRoleForUserRole("participant")).toBe("participant");
  });
});

describe("invoice payable gating", () => {
  it("allows Stripe Checkout for self-managed issued invoices", () => {
    expect(isInvoicePayable("issued", "ndis_self_managed")).toBe(true);
    expect(isInvoicePayable("sent", "private_card")).toBe(true);
    expect(isInvoicePayable("overdue", "private_pay")).toBe(true);
  });

  it("refuses plan-managed invoices even when issued", () => {
    expect(isInvoicePayable("issued", "ndis_plan_managed")).toBe(false);
    const decision = checkoutDecisionForFundingType("ndis_plan_managed");
    expect(decision.allowed).toBe(false);
  });

  it("treats paid and void invoices as settled", () => {
    expect(isInvoiceSettled("paid")).toBe(true);
    expect(isInvoiceSettled("void")).toBe(true);
    expect(isInvoiceSettled("issued")).toBe(false);
  });

  it("gates provider issue/send/void to the state machine", () => {
    expect(canIssueInvoiceFromStatus("ready_to_issue")).toBe(true);
    expect(canIssueInvoiceFromStatus("draft")).toBe(false);
    expect(canSendInvoiceFromStatus("issued")).toBe(true);
    expect(canSendInvoiceFromStatus("draft")).toBe(false);
    expect(canVoidInvoiceFromStatus("issued")).toBe(true);
    expect(canVoidInvoiceFromStatus("paid")).toBe(false);
  });
});

describe("checkout and portal return URLs", () => {
  it("returns invoice payers to /billing/invoices", () => {
    const urls = billingInvoiceCheckoutReturnUrls(
      "https://mapable.example",
      "inv_123"
    );
    expect(urls.successUrl).toBe(
      "https://mapable.example/billing/invoices?checkout=success&invoiceId=inv_123"
    );
    expect(urls.cancelUrl).toBe(
      "https://mapable.example/billing/invoices?checkout=cancelled&invoiceId=inv_123"
    );
  });

  it("returns the hosted portal to billing settings", () => {
    expect(billingPortalReturnUrl("https://mapable.example")).toBe(
      "https://mapable.example/billing/settings?portal=returned"
    );
  });

  it("tags Checkout sessions with an 8-letter integration identifier suffix", () => {
    const id = checkoutIntegrationIdentifier("mapable-invoice-pay");
    expect(id).toMatch(/^mapable-invoice-pay-[a-z]{8}$/);
  });
});

describe("customer billing nav", () => {
  it("hides ops workspaces for participants", () => {
    const links = billingNavLinksForRole({
      customerNav: true,
      includeSubscriptions: false,
    });
    expect(links.map((l) => l.href)).toEqual([
      "/billing/overview",
      "/billing/invoices",
      "/billing/payments",
      "/billing/settings",
    ]);
  });

  it("includes subscriptions when the customer has one", () => {
    const links = billingNavLinksForRole({
      customerNav: true,
      includeSubscriptions: true,
    });
    expect(links.some((l) => l.href === "/billing/subscriptions")).toBe(true);
  });
});
