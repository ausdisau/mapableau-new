import { prisma } from "@/lib/prisma";

export async function searchPlaces(query: string) {
  return prisma.accessiblePlace.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { address: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 20,
    include: { features: true },
  });
}
