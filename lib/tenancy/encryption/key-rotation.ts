import { prisma } from "@/lib/prisma";

export async function findOverdueRotations(now: Date = new Date()) {
  return prisma.tenantEncryptionProfile.findMany({
    where: {
      active: true,
      OR: [
        { nextRotationAt: null },
        { nextRotationAt: { lte: now } },
      ],
    },
    orderBy: { nextRotationAt: "asc" },
  });
}

export function computeNextRotation(fromDate: Date, days: number): Date {
  return new Date(fromDate.getTime() + Math.max(1, days) * 24 * 3600 * 1000);
}
