import { prisma } from "@/lib/prisma";

export async function getProvidersForOrganisation(organisationId: string) {
  return prisma.provider.findMany({
    where: { organisationId },
    select: { id: true, name: true, logoUrl: true },
    orderBy: { name: "asc" },
  });
}
