import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedEmergencyDemo() {
  await prisma.disasterAlert.upsert({
    where: { id: "seed-alert-nsw-demo" },
    create: {
      id: "seed-alert-nsw-demo",
      regionCode: "NSW",
      title: "Severe weather watch — demo",
      summary:
        "This is a demonstration alert. In a real event, follow advice from emergency services.",
      severity: "watch",
      source: "mapable_admin",
      active: true,
    },
    update: { active: true },
  });
}

if (require.main === module) {
  seedEmergencyDemo()
    .then(() => console.log("Emergency seed complete"))
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
