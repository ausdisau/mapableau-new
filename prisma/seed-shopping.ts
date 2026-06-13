import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type SeedClient = Pick<PrismaClient, "shopProduct">;

export const pilotShopProducts = [
  {
    slug: "ergonomic-keyboard",
    title: "Ergonomic split keyboard",
    description:
      "Low-force keys with adjustable split angle for reduced wrist strain during long typing sessions.",
    category: "assistive_technology" as const,
    unitAmountCents: 18900,
    gstApplicable: true,
    stockQuantity: 25,
    ndisRelevant: true,
    accessibilityNotes:
      "Suitable for one-handed or low-grip typing with optional key remapping software.",
    imageUrls: [],
  },
  {
    slug: "lightweight-rollator",
    title: "Lightweight rollator with seat",
    description:
      "Foldable four-wheel walker with padded seat, hand brakes, and storage pouch for community outings.",
    category: "mobility" as const,
    unitAmountCents: 34900,
    gstApplicable: true,
    stockQuantity: 12,
    ndisRelevant: true,
    accessibilityNotes: "Adjustable handle height. Check doorway width before ordering.",
    imageUrls: [],
  },
  {
    slug: "adaptive-cutlery-set",
    title: "Adaptive cutlery set (4 piece)",
    description:
      "Weighted, angled utensils designed for limited grip strength and tremor management.",
    category: "daily_living" as const,
    unitAmountCents: 5900,
    gstApplicable: true,
    stockQuantity: 40,
    ndisRelevant: true,
    accessibilityNotes: "Dishwasher safe. Left- and right-hand options included.",
    imageUrls: [],
  },
  {
    slug: "reach-grabber",
    title: "Long-handled reach grabber",
    description:
      "Lightweight grabber tool for picking up items from floor height without bending.",
    category: "daily_living" as const,
    unitAmountCents: 3200,
    gstApplicable: true,
    stockQuantity: 60,
    ndisRelevant: false,
    accessibilityNotes: "Rotating jaw with rubber tips for secure grip.",
    imageUrls: [],
  },
  {
    slug: "noise-cancelling-headset",
    title: "Noise-cancelling communication headset",
    description:
      "Over-ear headset with clear microphone for video calls, telehealth, and sensory regulation.",
    category: "communication" as const,
    unitAmountCents: 12900,
    gstApplicable: true,
    stockQuantity: 30,
    ndisRelevant: true,
    accessibilityNotes: "Bluetooth and wired modes. Large tactile volume controls.",
    imageUrls: [],
  },
  {
    slug: "tablet-mount",
    title: "Adjustable tablet mount for wheelchair or desk",
    description:
      "Clamp-on mount with 360° rotation for AAC apps, telehealth, and environmental controls.",
    category: "assistive_technology" as const,
    unitAmountCents: 8900,
    gstApplicable: true,
    stockQuantity: 18,
    ndisRelevant: true,
    accessibilityNotes: "Compatible with most 10–13 inch tablets. Check chair arm width.",
    imageUrls: [],
  },
  {
    slug: "portable-threshold-ramp",
    title: "Portable threshold ramp (800 mm)",
    description:
      "Lightweight aluminium ramp for single-step thresholds at home or community venues.",
    category: "mobility" as const,
    unitAmountCents: 15900,
    gstApplicable: true,
    stockQuantity: 15,
    ndisRelevant: true,
    accessibilityNotes: "Non-slip surface. Maximum rise 75 mm — measure before purchase.",
    imageUrls: [],
  },
  {
    slug: "weighted-lap-blanket",
    title: "Weighted lap blanket (2 kg)",
    description:
      "Compact weighted blanket for sensory regulation during travel, work, or rest.",
    category: "daily_living" as const,
    unitAmountCents: 7900,
    gstApplicable: true,
    stockQuantity: 22,
    ndisRelevant: false,
    accessibilityNotes: "Machine washable cover. Not suitable for overnight unsupervised use.",
    imageUrls: [],
  },
];

export async function seedMapAbleShopping(client: SeedClient = prisma as SeedClient) {
  console.log("Seeding MapAble Shopping pilot catalogue...");
  for (const product of pilotShopProducts) {
    await client.shopProduct.upsert({
      where: { slug: product.slug },
      create: {
        ...product,
        status: "published",
        currency: "AUD",
        imageUrls: product.imageUrls,
      },
      update: {
        title: product.title,
        description: product.description,
        category: product.category,
        status: "published",
        unitAmountCents: product.unitAmountCents,
        gstApplicable: product.gstApplicable,
        stockQuantity: product.stockQuantity,
        ndisRelevant: product.ndisRelevant,
        accessibilityNotes: product.accessibilityNotes,
        imageUrls: product.imageUrls,
      },
    });
  }
  console.log(`  Upserted ${pilotShopProducts.length} shop products`);
}
