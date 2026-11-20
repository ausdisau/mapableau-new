import { afterEach, describe, expect, it } from "vitest";

import { calculateInvoiceTotals } from "@/lib/billing/core/calculations";
import { checkoutDecisionForFundingType } from "@/lib/billing/core/funding-logic";
import { isMarketplaceSurfaceEnabled } from "@/lib/config/year-one-scope";
import { marketplaceCheckoutSchema } from "@/lib/marketplace/checkout-schema";
import {
  marketplaceCartFingerprint,
  quoteMarketplaceCheckout,
  resolveMarketplaceCheckoutLines,
} from "@/lib/marketplace/checkout-service";

describe("marketplace checkout schema", () => {
  it("accepts product ids and quantities without amounts", () => {
    const parsed = marketplaceCheckoutSchema.safeParse({
      pathway: "ordinary_purchase",
      items: [{ productId: "mp_reacher", quantity: 2 }],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects client-supplied unit amounts (price tampering)", () => {
    const parsed = marketplaceCheckoutSchema.safeParse({
      pathway: "ordinary_purchase",
      items: [
        {
          productId: "mp_reacher",
          quantity: 1,
          unitAmountCents: 1,
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects top-level totalCents tampering", () => {
    const parsed = marketplaceCheckoutSchema.safeParse({
      items: [{ productId: "mp_reacher", quantity: 1 }],
      totalCents: 1,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("marketplace checkout pricing", () => {
  it("resolves trusted catalogue prices server-side", () => {
    const resolved = resolveMarketplaceCheckoutLines([
      { productId: "mp_reacher", quantity: 2 },
    ]);
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.lines[0]?.unitAmountCents).toBe(3500);
    expect(resolved.lines[0]?.description).toContain("Daily Living Supplies");
  });

  it("rejects unknown and out-of-stock products", () => {
    expect(resolveMarketplaceCheckoutLines([{ productId: "nope", quantity: 1 }]).ok).toBe(
      false,
    );
    expect(
      resolveMarketplaceCheckoutLines([{ productId: "mp_comm_board", quantity: 1 }]).ok,
    ).toBe(false);
  });

  it("quotes subtotal, GST and platform fee matching billing calculations", () => {
    const quote = quoteMarketplaceCheckout([
      { productId: "mp_reacher", quantity: 2 },
    ]);
    expect(quote.ok).toBe(true);
    if (!quote.ok) return;

    const expected = calculateInvoiceTotals([
      { quantity: 2, unitAmountCents: 3500, gstApplicable: true },
    ]);
    expect(quote.totals).toEqual(expected);
    expect(quote.disclosures.ndisEligibilityClaim).toBe(false);
  });

  it("changes reuse fingerprint when unit price or totals change", () => {
    const quote = quoteMarketplaceCheckout([
      { productId: "mp_reacher", quantity: 1 },
    ]);
    expect(quote.ok).toBe(true);
    if (!quote.ok) return;

    const base = marketplaceCartFingerprint({
      pathway: "ordinary_purchase",
      lines: quote.lines,
      totals: quote.totals,
    });
    const priceChanged = marketplaceCartFingerprint({
      pathway: "ordinary_purchase",
      lines: quote.lines.map((line) => ({
        ...line,
        unitAmountCents: line.unitAmountCents + 100,
      })),
      totals: quote.totals,
    });
    const totalChanged = marketplaceCartFingerprint({
      pathway: "ordinary_purchase",
      lines: quote.lines,
      totals: { ...quote.totals, totalCents: quote.totals.totalCents + 50 },
    });
    expect(base).not.toEqual(priceChanged);
    expect(base).not.toEqual(totalChanged);
  });

  it("keeps the same lock fingerprint regardless of funding source id", () => {
    const quote = quoteMarketplaceCheckout([
      { productId: "mp_reacher", quantity: 1 },
    ]);
    expect(quote.ok).toBe(true);
    if (!quote.ok) return;

    const fingerprint = marketplaceCartFingerprint({
      pathway: "ordinary_purchase",
      lines: quote.lines,
      totals: quote.totals,
    });
    // Parallel first checkouts must share one lock before either creates a
    // FundingSource — the key must not embed a source id. Reuse still filters
    // by the resolved fundingSourceId column so alternate sources do not share
    // a draft invoice / plan-manager export.
    expect(fingerprint).not.toContain("fundingSourceId");
    expect(fingerprint).toContain("ordinary_purchase");
  });

  it("keeps support-item codes on lines without implying invoice claimability", () => {
    const withoutCode = resolveMarketplaceCheckoutLines([
      { productId: "mp_reacher", quantity: 1 },
    ]);
    const withCode = resolveMarketplaceCheckoutLines([
      { productId: "mp_keyboard", quantity: 1 },
    ]);
    expect(withoutCode.ok && !withoutCode.lines[0]?.ndisLineItem).toBe(true);
    expect(withCode.ok && Boolean(withCode.lines[0]?.ndisLineItem)).toBe(true);
    // Checkout service always persists ndisClaimable=false for catalogue carts.
  });
});

describe("marketplace payment pathways", () => {
  it("allows card checkout for ordinary and self-managed pathways", () => {
    expect(checkoutDecisionForFundingType("private_card").allowed).toBe(true);
    expect(checkoutDecisionForFundingType("ndis_self_managed").allowed).toBe(true);
  });

  it("blocks card checkout for plan-managed pathway (export only)", () => {
    const decision = checkoutDecisionForFundingType("ndis_plan_managed");
    expect(decision.allowed).toBe(false);
    if (decision.allowed) return;
    expect(decision.reason).toBe("plan_managed");
  });
});

describe("marketplace surface gate", () => {
  afterEach(() => {
    delete process.env.MAPABLE_MARKETPLACE_ENABLED;
  });

  it("is off by default so checkout APIs stay deferred", () => {
    delete process.env.MAPABLE_MARKETPLACE_ENABLED;
    expect(isMarketplaceSurfaceEnabled()).toBe(false);
  });

  it("enables only when MAPABLE_MARKETPLACE_ENABLED=true", () => {
    process.env.MAPABLE_MARKETPLACE_ENABLED = "true";
    expect(isMarketplaceSurfaceEnabled()).toBe(true);
  });
});
