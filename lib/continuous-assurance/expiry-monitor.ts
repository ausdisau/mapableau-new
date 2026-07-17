import { prisma } from "@/lib/prisma";

export async function listExpiringEvidence(withinDays = 30) {
  const cutoff = new Date(Date.now() + withinDays * 24 * 3600 * 1000);
  return prisma.assuranceEvidence.findMany({
    where: {
      isCurrent: true,
      expiresAt: { lte: cutoff, gte: new Date() },
    },
    orderBy: { expiresAt: "asc" },
    take: 500,
  });
}
