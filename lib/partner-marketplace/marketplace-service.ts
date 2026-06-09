import { prisma } from "@/lib/prisma";
import { phase8Config } from "@/lib/config/phase8";

export async function listMarketplaceListings() {
  if (!phase8Config.partnerMarketplaceEnabled) {
    return { disabled: true, listings: [] as never[] };
  }

  const featuredOrgIds = new Set<string>();
  const featuredSubscriptions = await prisma.billingSubscription.findMany({
    where: {
      planCode: "marketplace_featured",
      status: { in: ["active", "trialing"] },
    },
    select: { userId: true },
  });

  if (featuredSubscriptions.length > 0) {
    const members = await prisma.organisationMember.findMany({
      where: { userId: { in: featuredSubscriptions.map((s) => s.userId) } },
      select: { organisationId: true },
    });
    for (const member of members) {
      featuredOrgIds.add(member.organisationId);
    }
  }

  const listings = await prisma.partnerMarketplaceListing.findMany({
    where: { status: "published" },
    orderBy: [{ publishedAt: "desc" }],
    take: 50,
  });

  const sorted = [...listings].sort((a, b) => {
    const aFeatured = a.organisationId
      ? featuredOrgIds.has(a.organisationId)
      : false;
    const bFeatured = b.organisationId
      ? featuredOrgIds.has(b.organisationId)
      : false;
    if (aFeatured !== bFeatured) return aFeatured ? -1 : 1;
    return (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0);
  });

  return { disabled: false, listings: sorted.slice(0, 30) };
}

export async function publishMarketplaceListing(listingId: string) {
  if (!phase8Config.partnerMarketplaceEnabled) {
    throw new Error("PARTNER_MARKETPLACE_DISABLED");
  }
  return prisma.partnerMarketplaceListing.update({
    where: { id: listingId },
    data: { status: "published", publishedAt: new Date() },
  });
}

export async function createMarketplaceCheckout(params: {
  userId: string;
  listingId: string;
}) {
  const listing = await prisma.partnerMarketplaceListing.findUnique({
    where: { id: params.listingId, status: "published" },
  });
  if (!listing) throw new Error("LISTING_NOT_FOUND");

  const { createDraftInvoice } = await import("@/lib/billing-core/invoice-service");
  const { createCheckoutForInvoice } = await import(
    "@/lib/billing-core/checkout-service"
  );

  const invoice = await createDraftInvoice(params.userId, {
    providerId: listing.organisationId ?? undefined,
    serviceType: "marketplace",
    lineItems: [
      {
        description: listing.title,
        quantity: 1,
        unitAmountCents: 15000,
        gstApplicable: true,
        metadata: { listingId: listing.id, category: listing.category },
      },
    ],
  });

  const checkout = await createCheckoutForInvoice(params.userId, invoice.id);
  if (!checkout.ok) return checkout;

  return { ok: true as const, checkoutUrl: checkout.checkoutUrl, invoiceId: invoice.id };
}
