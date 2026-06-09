import type { PrismaClient } from "@prisma/client";

/**
 * Optional demo advertiser + active campaign for Provider Finder QA.
 * Requires a verified organisation from seed-mapable-core.
 */
export async function seedAdsDemo(prisma: PrismaClient) {
  const org = await prisma.organisation.findFirst({
    where: { verificationStatus: "verified" },
  });
  if (!org) {
    console.log("seed-ads-demo: no verified organisation, skipping");
    return;
  }

  const advertiser = await prisma.adAdvertiser.upsert({
    where: { organisationId: org.id },
    create: {
      organisationId: org.id,
      category: "ndis_provider",
      onboardingStatus: "active",
      termsAcceptedAt: new Date(),
      contactEmail: org.contactEmail ?? "ads-demo@mapable.test",
    },
    update: {
      onboardingStatus: "active",
    },
  });

  const existing = await prisma.adCampaign.findFirst({
    where: { advertiserId: advertiser.id, name: "Demo Provider Finder campaign" },
  });
  if (existing) {
    console.log("seed-ads-demo: demo campaign already exists");
    return;
  }

  const providerUser = await prisma.organisationMember.findFirst({
    where: { organisationId: org.id },
    include: { user: true },
  });
  const payerId = providerUser?.userId;
  if (!payerId) {
    console.log("seed-ads-demo: no org member for billing, skipping campaign");
    return;
  }

  const invoice = await prisma.billingInvoice.create({
    data: {
      userId: payerId,
      providerId: org.id,
      serviceType: "advertising",
      status: "paid",
      subtotalCents: 49900,
      totalCents: 49900,
      paidAt: new Date(),
      lineItems: {
        create: {
          description: "MapAble Ads — Demo Provider Finder campaign",
          unitAmountCents: 49900,
          totalCents: 49900,
        },
      },
    },
  });

  const campaign = await prisma.adCampaign.create({
    data: {
      advertiserId: advertiser.id,
      name: "Demo Provider Finder campaign",
      status: "active",
      budgetCents: 1_000_000,
      spentCents: 0,
      billingInvoiceId: invoice.id,
      targeting: {
        placements: [
          "skyscraper_left",
          "skyscraper_right",
          "sponsored_provider_card",
        ],
        pageContexts: ["provider_finder"],
        states: ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"],
        deviceTypes: ["mobile", "tablet", "desktop", "unknown"],
      },
      startAt: new Date(),
      endAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.adModerationReview.create({
    data: {
      campaignId: campaign.id,
      decision: "approved",
      notes: "Demo seed approval",
      reviewedAt: new Date(),
    },
  });

  await prisma.adCreative.create({
    data: {
      campaignId: campaign.id,
      placements: [
        "skyscraper_left",
        "skyscraper_right",
        "sponsored_provider_card",
      ],
      headline: "Accessible supports near you",
      body: "MapAble connects participants with verified providers. Explore services that respect access needs.",
      ctaLabel: "Learn more",
      altText:
        "MapAble advertisement: accessible disability supports and provider discovery on the platform.",
      landingUrl: "https://mapable.com.au/provider-finder",
    },
  });

  console.log("seed-ads-demo: created active demo campaign", campaign.id);
}
