import { describe, expect, it, vi } from "vitest";

import {
  calculateGstCents,
  calculateInvoiceTotals,
} from "@/lib/billing-core/calculations";
import { marketplaceAtPurchaseFixture } from "@/lib/billing-core/fixtures";
import {
  checkoutDecisionForFundingType,
  stripeCheckoutAllowed,
} from "@/lib/billing-core/funding-logic";
import { createInvoiceSchema } from "@/lib/billing-core/schemas";
import {
  calculateCartTotalsFromLines,
} from "@/lib/shopping/cart-service";
import {
  cartItemMutationSchema,
  checkoutSchema,
  createShopProductSchema,
  listProductsQuerySchema,
} from "@/lib/shopping/schemas";
import { getProductImageUrl } from "@/lib/shopping/images";
import {
  getStockLabel,
  isProductInStock,
} from "@/lib/shopping/stock";
import { pilotShopProducts } from "@/prisma/seed-shopping";

describe("shopping cart totals", () => {
  it("matches billing-core GST for marketplace fixture line", () => {
    const lines = [
      {
        productId: "prod_1",
        slug: "ergonomic-keyboard",
        title: "Ergonomic split keyboard",
        quantity: 1,
        unitAmountCents: 18900,
        gstApplicable: true,
        ndisRelevant: true,
        lineSubtotalCents: 18900,
      },
    ];

    const totals = calculateCartTotalsFromLines(lines);
    const billingItems = marketplaceAtPurchaseFixture.lineItems.map((li) => ({
      quantity: li.quantity,
      unitAmountCents: li.unitAmountCents,
      gstApplicable: li.gstApplicable,
    }));

    expect(totals.subtotalCents).toBe(18900);
    expect(totals.gstCents).toBe(calculateGstCents(billingItems));
    expect(totals.totalCents).toBe(calculateInvoiceTotals(billingItems).totalCents);
  });

  it("sums multiple cart lines with platform fee", () => {
    const lines = [
      {
        productId: "a",
        slug: "a",
        title: "A",
        quantity: 2,
        unitAmountCents: 5000,
        gstApplicable: false,
        ndisRelevant: false,
        lineSubtotalCents: 10000,
      },
      {
        productId: "b",
        slug: "b",
        title: "B",
        quantity: 1,
        unitAmountCents: 3200,
        gstApplicable: true,
        ndisRelevant: false,
        lineSubtotalCents: 3200,
      },
    ];

    const totals = calculateCartTotalsFromLines(lines);
    expect(totals.subtotalCents).toBe(13200);
    expect(totals.gstCents).toBe(320);
    expect(totals.platformFeeCents).toBeGreaterThan(0);
    expect(totals.totalCents).toBe(
      totals.subtotalCents + totals.gstCents + totals.platformFeeCents
    );
  });
});

describe("shopping checkout eligibility", () => {
  it("blocks plan-managed NDIS funding", () => {
    const decision = checkoutDecisionForFundingType("ndis_plan_managed");
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toBe("plan_managed");
    }
  });

  it("allows self-managed and private card", () => {
    expect(stripeCheckoutAllowed("ndis_self_managed")).toBe(true);
    expect(stripeCheckoutAllowed("private_card")).toBe(true);
  });
});

describe("shopping schemas", () => {
  it("validates pilot product seed shape", () => {
    for (const product of pilotShopProducts) {
      expect(createShopProductSchema.safeParse(product).success).toBe(true);
    }
  });

  it("parses cart mutation with zero quantity for removal", () => {
    expect(
      cartItemMutationSchema.safeParse({ productId: "clxyz123456789012345678901", quantity: 0 })
        .success
    ).toBe(true);
  });

  it("defaults list query pagination", () => {
    const parsed = listProductsQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(12);
  });
});

describe("shopping invoice fixture", () => {
  it("creates marketplace invoice from AT purchase fixture", () => {
    expect(createInvoiceSchema.safeParse(marketplaceAtPurchaseFixture).success).toBe(
      true
    );
  });
});

describe("published catalogue filter contract", () => {
  it("product list query excludes invalid categories", () => {
    const result = listProductsQuerySchema.safeParse({ category: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("shopping stock helpers", () => {
  it("treats null stock as in stock", () => {
    expect(isProductInStock(null)).toBe(true);
  });

  it("marks zero stock as out of stock", () => {
    expect(isProductInStock(0)).toBe(false);
    expect(getStockLabel(0)).toBe("Out of stock");
  });

  it("shows low stock warning at five or fewer", () => {
    expect(getStockLabel(5)).toBe("Only 5 left");
    expect(getStockLabel(6)).toBe("In stock");
  });

  it("resolves product image with placeholder fallback", () => {
    expect(getProductImageUrl([], "Test product")).toContain("placehold.co");
    expect(getProductImageUrl(["https://cdn.example.com/a.jpg"], "Test")).toBe(
      "https://cdn.example.com/a.jpg"
    );
  });
});

describe("shopping checkout schema", () => {
  it("accepts optional shipping address", () => {
    const parsed = checkoutSchema.safeParse({
      fundingSourceId: "clxyz123456789012345678901",
      shippingName: "Alex Example",
      shippingAddress: {
        line1: "1 Main St",
        suburb: "Sydney",
        state: "NSW",
        postcode: "2000",
        country: "Australia",
      },
    });
    expect(parsed.success).toBe(true);
  });
});

describe("shopping order cancellation", () => {
  it("cancelShopOrderForInvoice is exported for webhook use", async () => {
    const { cancelShopOrderForInvoice } = await import(
      "@/lib/shopping/order-service"
    );
    expect(typeof cancelShopOrderForInvoice).toBe("function");
  });
});

vi.mock("@/lib/billing-core/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/billing-core/config")>();
  return {
    ...actual,
    billingCoreConfig: {
      ...actual.billingCoreConfig,
      platformFeeBps: 1000,
      gstBps: 1000,
    },
  };
});
