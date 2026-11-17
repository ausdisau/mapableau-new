import type { BillingFundingSourceType } from "@prisma/client";

import { writeBillingAuditLog } from "@/lib/billing/core/audit";
import { calculateInvoiceTotals } from "@/lib/billing/core/calculations";
import { createCheckoutForInvoice } from "@/lib/billing/core/checkout-service";
import { checkoutDecisionForFundingType } from "@/lib/billing/core/funding-logic";
import {
  createFundingSource,
  listFundingSources,
} from "@/lib/billing/core/funding-source-service";
import { createDraftInvoice } from "@/lib/billing/core/invoice-service";
import { getMarketplaceProduct } from "@/lib/marketplace/catalog";
import type {
  MarketplaceCheckoutInput,
  MarketplaceCheckoutPathway,
} from "@/lib/marketplace/checkout-schema";
import { prisma } from "@/lib/prisma";

const PATHWAY_FUNDING_TYPE: Record<
  MarketplaceCheckoutPathway,
  BillingFundingSourceType
> = {
  ordinary_purchase: "private_card",
  ndis_self_managed: "ndis_self_managed",
  ndis_plan_managed: "ndis_plan_managed",
};

const PATHWAY_LABEL: Record<MarketplaceCheckoutPathway, string> = {
  ordinary_purchase: "Ordinary private purchase",
  ndis_self_managed: "NDIS self-managed (card)",
  ndis_plan_managed: "NDIS plan-managed (export only)",
};

export type ResolvedMarketplaceLine = {
  productId: string;
  slug: string;
  description: string;
  quantity: number;
  unitAmountCents: number;
  gstApplicable: boolean;
  ndisLineItem?: string;
  sellerName: string;
};

export function resolveMarketplaceCheckoutLines(
  items: MarketplaceCheckoutInput["items"],
):
  | { ok: true; lines: ResolvedMarketplaceLine[] }
  | { ok: false; error: string; status: number } {
  const lines: ResolvedMarketplaceLine[] = [];

  for (const item of items) {
    const product = getMarketplaceProduct(item.productId);
    if (!product) {
      return {
        ok: false,
        error: `Unknown product: ${item.productId}`,
        status: 400,
      };
    }
    if (!product.inStock) {
      return {
        ok: false,
        error: `${product.name} is out of stock`,
        status: 400,
      };
    }
    lines.push({
      productId: product.id,
      slug: product.slug,
      description: `${product.name} — ${product.sellerName}`,
      quantity: item.quantity,
      unitAmountCents: product.priceCents,
      gstApplicable: product.gstApplicable,
      ndisLineItem: product.ndisSupportItemCode,
      sellerName: product.sellerName,
    });
  }

  return { ok: true, lines };
}

export function quoteMarketplaceCheckout(
  items: MarketplaceCheckoutInput["items"],
) {
  const resolved = resolveMarketplaceCheckoutLines(items);
  if (!resolved.ok) return resolved;
  const totals = calculateInvoiceTotals(
    resolved.lines.map((line) => ({
      quantity: line.quantity,
      unitAmountCents: line.unitAmountCents,
      gstApplicable: line.gstApplicable,
    })),
  );
  return {
    ok: true as const,
    lines: resolved.lines,
    totals,
    currency: "AUD",
    disclosures: {
      platformFeeLabel: "MapAble platform fee (commission)",
      gstLabel: "GST",
      ndisEligibilityClaim: false,
      note: "Paying for assistive technology does not imply NDIS eligibility or plan approval.",
    },
  };
}

async function resolveFundingSourceForPathway(
  userId: string,
  pathway: MarketplaceCheckoutPathway,
  fundingSourceId?: string,
) {
  const fundingType = PATHWAY_FUNDING_TYPE[pathway];

  if (fundingSourceId) {
    const owned = await prisma.billingFundingSource.findFirst({
      where: { id: fundingSourceId, userId },
    });
    if (!owned) {
      return { ok: false as const, error: "Funding source not found", status: 404 };
    }
    if (owned.type !== fundingType) {
      return {
        ok: false as const,
        error: `Funding source type ${owned.type} does not match pathway ${pathway}`,
        status: 400,
      };
    }
    return { ok: true as const, fundingSource: owned };
  }

  const existing = await listFundingSources(userId);
  const match = existing.find((source) => source.type === fundingType);
  if (match) return { ok: true as const, fundingSource: match };

  // Never steal an existing default funding source (e.g. NDIS) for a cart buy.
  const created = await createFundingSource(userId, {
    type: fundingType,
    label: PATHWAY_LABEL[pathway],
    isDefault: false,
  });
  return { ok: true as const, fundingSource: created };
}

function marketplaceCartFingerprint(
  pathway: MarketplaceCheckoutPathway,
  fundingSourceId: string,
  items: MarketplaceCheckoutInput["items"],
): string {
  const normalized = [...items]
    .map((item) => ({ productId: item.productId, quantity: item.quantity }))
    .sort((a, b) => a.productId.localeCompare(b.productId));
  return JSON.stringify({ pathway, fundingSourceId, items: normalized });
}

function invoiceMatchesFingerprint(
  invoice: {
    lineItems: Array<{ metadata?: unknown }>;
  },
  fingerprint: string,
): boolean {
  const firstMeta = invoice.lineItems[0]?.metadata as
    | { checkoutFingerprint?: string }
    | null
    | undefined;
  return firstMeta?.checkoutFingerprint === fingerprint;
}

/**
 * Create a pending marketplace BillingInvoice from trusted catalogue prices,
 * then start Stripe Checkout when the pathway allows card payment.
 */
export async function createMarketplaceCheckout(
  userId: string,
  input: MarketplaceCheckoutInput,
) {
  const pathway = input.pathway ?? "ordinary_purchase";
  const quote = quoteMarketplaceCheckout(input.items);
  if (!quote.ok) return quote;

  const funding = await resolveFundingSourceForPathway(
    userId,
    pathway,
    input.fundingSourceId,
  );
  if (!funding.ok) return funding;

  const decision = checkoutDecisionForFundingType(funding.fundingSource.type);
  const fingerprint = marketplaceCartFingerprint(
    pathway,
    funding.fundingSource.id,
    input.items,
  );

  // Reuse a recent unpaid invoice for the same cart to avoid duplicate drafts
  // on retries / cancelled Checkout.
  const recentInvoices = await prisma.billingInvoice.findMany({
    where: {
      userId,
      serviceType: "marketplace",
      status: { in: ["draft", "pending_payment"] },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    include: { lineItems: true, fundingSource: true },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  let invoice =
    recentInvoices.find((candidate) =>
      invoiceMatchesFingerprint(candidate, fingerprint),
    ) ?? null;

  if (!invoice) {
    // Catalogue support-item codes are informational only — a cart purchase does
    // not imply NDIS eligibility/assessment, so keep invoices non-claimable.
    invoice = await createDraftInvoice(userId, {
      serviceType: "marketplace",
      fundingSourceId: funding.fundingSource.id,
      ndisClaimable: false,
      lineItems: quote.lines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitAmountCents: line.unitAmountCents,
        gstApplicable: line.gstApplicable,
        ndisLineItem: line.ndisLineItem,
        metadata: {
          productId: line.productId,
          slug: line.slug,
          sellerName: line.sellerName,
          pathway,
          checkoutSource: "marketplace_cart",
          checkoutFingerprint: fingerprint,
          // Catalogue sellers are display names until Connect-bound seller IDs exist.
          sellerSplitDeferred: true,
        },
      })),
    });

    await writeBillingAuditLog({
      actorUserId: userId,
      entityType: "BillingInvoice",
      entityId: invoice.id,
      action: "marketplace_checkout_draft",
      after: {
        pathway,
        totalCents: invoice.totalCents,
        lineCount: quote.lines.length,
        fingerprint,
        sellerSplitDeferred: true,
      },
    });
  }

  if (!decision.allowed) {
    return {
      ok: true as const,
      mode: "export_only" as const,
      invoiceId: invoice.id,
      invoicePath: `/dashboard/billing/invoices/${invoice.id}`,
      totals: {
        subtotalCents: invoice.subtotalCents,
        gstCents: invoice.gstCents,
        platformFeeCents: invoice.platformFeeCents,
        totalCents: invoice.totalCents,
      },
      decision,
      disclosures: quote.disclosures,
    };
  }

  const checkout = await createCheckoutForInvoice(userId, invoice.id);
  if (!checkout.ok) {
    return {
      ok: false as const,
      error: checkout.error ?? "Checkout failed",
      status: "configured" in checkout && checkout.configured === false ? 503 : 400,
      invoiceId: invoice.id,
      decision: "decision" in checkout ? checkout.decision : undefined,
    };
  }

  return {
    ok: true as const,
    mode: "stripe_checkout" as const,
    invoiceId: invoice.id,
    checkoutUrl: checkout.checkoutUrl,
    sessionId: checkout.sessionId,
    totals: {
      subtotalCents: invoice.subtotalCents,
      gstCents: invoice.gstCents,
      platformFeeCents: invoice.platformFeeCents,
      totalCents: invoice.totalCents,
    },
    disclosures: quote.disclosures,
  };
}
