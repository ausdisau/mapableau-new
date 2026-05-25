import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedMapAbleFoods() {
  console.log("Seeding MapAble Foods...");

  const participant = await prisma.user.findUnique({
    where: { email: "participant@mapable.test" },
  });
  const providerAdmin = await prisma.user.findUnique({
    where: { email: "provider@mapable.test" },
  });

  const org = await prisma.organisation.upsert({
    where: { id: "seed-foods-org" },
    create: {
      id: "seed-foods-org",
      name: "MapAble Pantry Demo",
      organisationType: "food_vendor",
      contactEmail: "foods@mapable.test",
      serviceRegions: ["Melbourne"],
      status: "active",
      verificationStatus: "verified",
    },
    update: { organisationType: "food_vendor", status: "active" },
  });

  if (providerAdmin) {
    await prisma.organisationMember.upsert({
      where: {
        userId_organisationId: {
          userId: providerAdmin.id,
          organisationId: org.id,
        },
      },
      create: {
        userId: providerAdmin.id,
        organisationId: org.id,
        role: "provider_admin",
      },
      update: {},
    });
  }

  const vendor = await prisma.foodVendor.upsert({
    where: { organisationId: org.id },
    create: {
      organisationId: org.id,
      displayName: "MapAble Pantry Demo",
      description: "Accessible groceries and prepared meals for demo flows.",
      serviceRegions: ["Melbourne"],
      openingHours: { monday: ["09:00", "17:00"] },
    },
    update: { active: true },
  });

  await prisma.foodProduct.upsert({
    where: { id: "seed-foods-meal-001" },
    create: {
      id: "seed-foods-meal-001",
      vendorId: vendor.id,
      organisationId: org.id,
      title: "Low sensory vegetable lasagne",
      description: "Prepared meal with clear texture and allergen tags.",
      productType: "prepared_meal",
      priceCents: 1295,
      preparationFeeCents: 250,
      deliveryFeeCents: 600,
      dietaryTags: ["vegetarian"],
      allergenTags: ["gluten", "dairy"],
      accessibilityTags: ["easy_open_packaging"],
      published: true,
    },
    update: { published: true },
  });

  if (participant) {
    await prisma.foodParticipantPreference.upsert({
      where: { participantId: participant.id },
      create: {
        participantId: participant.id,
        dietaryPreferences: ["vegetarian"],
        texturePreferences: ["soft"],
      },
      update: {},
    });
  }

  console.log(`  Foods seed: vendor ${vendor.id}`);
}
