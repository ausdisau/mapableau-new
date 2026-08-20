/**
 * Seed synthetic MapAble Ads foundation data.
 * Safe to run repeatedly (upsert by fixed ids).
 *
 * Usage: pnpm exec tsx prisma/seed-ads-foundation.ts
 */

import { PrismaClient } from "@prisma/client";

import {
  SYNTHETIC_CREATIVE_DIRECT_ID,
  SYNTHETIC_CREATIVE_HOUSE_ID,
  SYNTHETIC_DIRECT_CAMPAIGN_ID,
  SYNTHETIC_HOUSE_CAMPAIGN_ID,
} from "../lib/ads/fixtures/synthetic-inventory";
import { PLACEMENT_REGISTRY } from "../lib/ads/placement-registry";

const prisma = new PrismaClient();

const ADVERTISER_HOUSE_ID = "adv_synth_mapable_house";
const ADVERTISER_DIRECT_ID = "adv_synth_example_cafe";

async function main() {
  await prisma.adAdvertiser.upsert({
    where: { id: ADVERTISER_HOUSE_ID },
    create: {
      id: ADVERTISER_HOUSE_ID,
      name: "MapAble House",
      status: "ACTIVE",
    },
    update: { status: "ACTIVE", name: "MapAble House" },
  });

  await prisma.adAdvertiser.upsert({
    where: { id: ADVERTISER_DIRECT_ID },
    create: {
      id: ADVERTISER_DIRECT_ID,
      name: "Example Inclusive Café (synthetic)",
      status: "ACTIVE",
    },
    update: { status: "ACTIVE" },
  });

  await prisma.adCampaign.upsert({
    where: { id: SYNTHETIC_HOUSE_CAMPAIGN_ID },
    create: {
      id: SYNTHETIC_HOUSE_CAMPAIGN_ID,
      advertiserId: ADVERTISER_HOUSE_ID,
      name: "MapAble Academy house promotion",
      status: "ACTIVE",
      isHouse: true,
      priority: 10,
      providerPreference: "mapable_internal",
      placementCodes: [
        "access.map.sponsored-card",
        "access.results.inline",
        "access.map.bottom-sheet",
        "provider-finder.results.inline",
        "provider-finder.sidebar",
        "provider-finder.map.sponsored-card",
      ],
    },
    update: { status: "ACTIVE", priority: 10 },
  });

  await prisma.adCampaign.upsert({
    where: { id: SYNTHETIC_DIRECT_CAMPAIGN_ID },
    create: {
      id: SYNTHETIC_DIRECT_CAMPAIGN_ID,
      advertiserId: ADVERTISER_DIRECT_ID,
      name: "Example Inclusive Café sponsored",
      status: "ACTIVE",
      isHouse: false,
      priority: 50,
      providerPreference: "mapable_internal",
      placementCodes: [
        "access.map.sponsored-marker",
        "access.map.sponsored-card",
        "access.results.inline",
      ],
    },
    update: { status: "ACTIVE", priority: 50 },
  });

  await prisma.adCreative.upsert({
    where: { id: SYNTHETIC_CREATIVE_HOUSE_ID },
    create: {
      id: SYNTHETIC_CREATIVE_HOUSE_ID,
      campaignId: SYNTHETIC_HOUSE_CAMPAIGN_ID,
      format: "text_card",
      headline: "MapAble Academy",
      body: "Learn accessibility practices with MapAble Guides.",
      destinationUrl: "https://mapable.com.au/academy",
      businessName: "MapAble Academy",
      altText: "MapAble Academy house promotion",
      status: "APPROVED",
      reviewedAt: new Date(),
      reviewedBy: "seed",
    },
    update: { status: "APPROVED" },
  });

  await prisma.adCreative.upsert({
    where: { id: SYNTHETIC_CREATIVE_DIRECT_ID },
    create: {
      id: SYNTHETIC_CREATIVE_DIRECT_ID,
      campaignId: SYNTHETIC_DIRECT_CAMPAIGN_ID,
      format: "map_marker",
      headline: "Example Inclusive Café",
      body: "Accessibility information available on MapAble Access.",
      destinationUrl: "https://mapable.com.au/access",
      businessName: "Example Inclusive Café",
      latitude: -33.8688,
      longitude: 151.2093,
      altText: "Example Inclusive Café sponsored listing",
      status: "APPROVED",
      reviewedAt: new Date(),
      reviewedBy: "seed",
    },
    update: { status: "APPROVED" },
  });

  await prisma.adCampaignTarget.deleteMany({
    where: {
      campaignId: {
        in: [SYNTHETIC_HOUSE_CAMPAIGN_ID, SYNTHETIC_DIRECT_CAMPAIGN_ID],
      },
    },
  });

  await prisma.adCampaignTarget.create({
    data: {
      campaignId: SYNTHETIC_HOUSE_CAMPAIGN_ID,
      region: "national",
      category: "education",
      geometry: { type: "NATIONAL" },
    },
  });

  await prisma.adCampaignTarget.create({
    data: {
      campaignId: SYNTHETIC_DIRECT_CAMPAIGN_ID,
      region: "sydney",
      category: "hospitality",
      geometry: {
        type: "Point",
        coordinates: [151.2093, -33.8688],
        radiusKm: 50,
      },
    },
  });

  for (const def of Object.values(PLACEMENT_REGISTRY)) {
    await prisma.adPlacement.upsert({
      where: { code: def.code },
      create: {
        code: def.code,
        surface: def.surface,
        format: def.format,
        maxItems: def.capabilities.maxAds,
        status: "ACTIVE",
      },
      update: {
        surface: def.surface,
        format: def.format,
        maxItems: def.capabilities.maxAds,
        status: "ACTIVE",
      },
    });
  }

  for (const provider of [
    "mapable_internal",
    "google_ad_manager",
    "ethicalads",
  ] as const) {
    await prisma.adProviderConfig.upsert({
      where: { provider },
      create: { provider, enabled: false },
      update: {},
    });
  }

  // eslint-disable-next-line no-console
  console.info("MapAble Ads synthetic seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
