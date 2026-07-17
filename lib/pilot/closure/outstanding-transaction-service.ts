import { prisma } from "@/lib/prisma";

export async function listOutstandingPilotReservations(pilotId: string) {
  return prisma.pilotLimitReservation.findMany({
    where: { pilotId, status: "reserved" },
    orderBy: { reservedAt: "asc" },
  });
}

export async function hasOutstandingPilotExposure(
  pilotId: string
): Promise<boolean> {
  const count = await prisma.pilotLimitReservation.count({
    where: { pilotId, status: "reserved" },
  });
  return count > 0;
}
