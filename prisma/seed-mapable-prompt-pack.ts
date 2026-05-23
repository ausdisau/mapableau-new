import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedPromptPackModules() {
  const place = await prisma.accessiblePlace.upsert({
    where: { id: "seed-place-demo" },
    create: {
      id: "seed-place-demo",
      name: "Demo Accessible Café",
      address: "1 Example St, Sydney NSW",
      confidence: "community_reviewed",
      features: {
        create: [{ type: "step_free_entry", notes: "Community reported" }],
      },
    },
    update: {},
  });

  await prisma.atMarketplaceListing.create({
    data: {
      sellerUserId: "seed-seller",
      title: "Demo wheelchair cushion",
      description: "Demo listing for development",
      listingType: "sell",
      category: "mobility",
      priceCents: 15000,
      status: "published",
      verificationStatus: "unverified",
      ndisNotes: "Confirm funding with your plan manager before purchase.",
    },
  }).catch(() => {
    /* ignore if user id invalid in empty db */
  });

  console.info("Prompt-pack seed:", place.id);
}

if (require.main === module) {
  seedPromptPackModules()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
