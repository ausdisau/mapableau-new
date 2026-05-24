import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedFoodsMoves() {
  const allergies = await Promise.all(
    [
      { slug: "peanut", label: "Peanut" },
      { slug: "tree-nut", label: "Tree nut" },
      { slug: "dairy", label: "Dairy" },
      { slug: "gluten", label: "Gluten" },
      { slug: "egg", label: "Egg" },
    ].map((a) =>
      prisma.allergy.upsert({
        where: { slug: a.slug },
        create: a,
        update: { label: a.label },
      }),
    ),
  );

  const menuDefs = [
    {
      name: "Soft vegetable casserole",
      description: "IDDSI soft texture, partner kitchen prepared",
      ingredients: "Vegetables, rice, olive oil, herbs",
      textureLevel: "soft" as const,
      ingredientCostCents: 450,
      preparationCostCents: 350,
      allergenSlugs: ["gluten"],
    },
    {
      name: "Minced beef & mash",
      description: "Minced moist texture",
      ingredients: "Beef mince, potato, gravy",
      textureLevel: "minced_moist" as const,
      ingredientCostCents: 600,
      preparationCostCents: 400,
      allergenSlugs: ["dairy"],
    },
    {
      name: "Pureed pumpkin soup",
      description: "Pureed, swallowing-friendly",
      ingredients: "Pumpkin, stock, cream",
      textureLevel: "pureed" as const,
      ingredientCostCents: 300,
      preparationCostCents: 250,
      allergenSlugs: ["dairy"],
    },
  ];

  for (const def of menuDefs) {
    const existing = await prisma.menuItem.findFirst({
      where: { name: def.name },
    });
    const item =
      existing ??
      (await prisma.menuItem.create({
        data: {
          name: def.name,
          description: def.description,
          ingredients: def.ingredients,
          textureLevel: def.textureLevel,
          ingredientCostCents: def.ingredientCostCents,
          preparationCostCents: def.preparationCostCents,
        },
      }));

    for (const slug of def.allergenSlugs) {
      const allergy = allergies.find((a) => a.slug === slug);
      if (!allergy) continue;
      await prisma.menuItemAllergen.upsert({
        where: {
          menuItemId_allergyId: {
            menuItemId: item.id,
            allergyId: allergy.id,
          },
        },
        create: { menuItemId: item.id, allergyId: allergy.id },
        update: {},
      });
    }
  }

  await prisma.therapistProfile.upsert({
    where: { id: "seed-therapist-demo" },
    create: {
      id: "seed-therapist-demo",
      displayName: "Alex Chen — Physiotherapy",
      profileSummary:
        "NDIS-experienced physiotherapist. Telehealth and home visits.",
      therapyTypes: ["physiotherapy", "exercise_physiology"],
      serviceRegions: ["Sydney", "Parramatta"],
      credentialStatus: "verified",
      telehealthEnabled: true,
      homeVisitEnabled: true,
      active: true,
      services: {
        create: [
          {
            therapyType: "physiotherapy",
            deliveryModes: ["telehealth", "home_visit", "clinic"],
            durationMinutes: 60,
            description: "Individual physiotherapy session",
          },
        ],
      },
    },
    update: {
      credentialStatus: "verified",
      active: true,
    },
  });

  console.log("Foods & Moves seed complete");
}

if (require.main === module) {
  seedFoodsMoves()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
