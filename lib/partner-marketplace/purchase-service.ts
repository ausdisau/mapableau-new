import { createDraftInvoice } from "@/lib/billing-core/invoice-service";
import { phase8Config } from "@/lib/config/phase8";
import { recordUsageEvent } from "@/lib/usage/usage-ledger";
import { prisma } from "@/lib/prisma";

export async function createMarketplacePurchaseInvoice(params: {
  buyerUserId: string;
  listingId: string;
}) {
  if (!phase8Config.partnerMarketplaceEnabled) {
    return { ok: false as const, error: "Marketplace purchases are not enabled" };
  }

  const listing = await prisma.partnerMarketplaceListing.findUnique({
    where: { id: params.listingId },
  });
  if (!listing || listing.status !== "published") {
    return { ok: false as const, error: "Listing not found or not published" };
  }

  const priceCents = Number(process.env.MARKETPLACE_DEFAULT_PRICE_CENTS ?? "9900");
  if (priceCents <= 0) {
    return { ok: false as const, error: "Marketplace pricing is not configured" };
  }

  const lineItems = [
    {
      description: `Marketplace: ${listing.title}`,
      quantity: 1,
      unitAmountCents: priceCents,
      gstApplicable: true,
    },
  ];

  const invoice = await createDraftInvoice(params.buyerUserId, {
    providerId: listing.organisationId ?? undefined,
    serviceType: "marketplace",
    lineItems: lineItems.map((li) => ({
      ...li,
      metadata: { listingId: params.listingId },
    })),
  });

  await recordUsageEvent({
    category: "module_completion",
    eventType: "marketplace.purchase_initiated",
    userId: params.buyerUserId,
    organisationId: listing.organisationId ?? undefined,
    entityType: "BillingInvoice",
    entityId: invoice.id,
    metadata: { listingId: params.listingId },
  });

  return { ok: true as const, invoiceId: invoice.id, totalCents: invoice.totalCents };
}
