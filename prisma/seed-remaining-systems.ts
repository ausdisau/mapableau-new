import type { PrismaClient } from "@prisma/client";

export async function seedRemainingSystems(prisma: PrismaClient) {
  const existingNdis = await prisma.ndisIntegrationSetting.findFirst();
  if (!existingNdis) {
    await prisma.ndisIntegrationSetting.create({
      data: { adapterType: "mock", active: true },
    });
  }

  await prisma.housingListing.createMany({
    data: [
      {
        title: "Demo accessible unit",
        description: "Fictional listing for local development",
        suburb: "Sydney",
        state: "NSW",
        verified: false,
        featuresJson: { step_free: true, wide_doorways: true },
      },
    ],
    skipDuplicates: true,
  });

  await prisma.dataRetentionPolicy.createMany({
    data: [
      { entityType: "AuditEvent", retainDays: 2555, active: true },
      { entityType: "Message", retainDays: 365, active: true },
    ],
    skipDuplicates: true,
  });
}
