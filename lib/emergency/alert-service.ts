import { prisma } from "@/lib/prisma";

export async function listActiveAlerts(regionCode?: string) {
  return prisma.disasterAlert.findMany({
    where: {
      active: true,
      ...(regionCode ? { regionCode } : {}),
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    },
    orderBy: { startsAt: "desc" },
    take: 20,
  });
}

export async function subscribeToRegion(
  participantId: string,
  regionCode: string,
) {
  return prisma.disasterAlertSubscription.upsert({
    where: {
      participantId_regionCode: { participantId, regionCode },
    },
    create: { participantId, regionCode },
    update: {},
  });
}

export async function listSubscriptions(participantId: string) {
  return prisma.disasterAlertSubscription.findMany({
    where: { participantId },
    include: { alert: true },
  });
}
