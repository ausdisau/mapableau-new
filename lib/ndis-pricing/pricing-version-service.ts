import { prisma } from "@/lib/prisma";

export async function getActiveCatalogueVersion() {
  const catalogue = await prisma.ndisPriceCatalogue.findFirst({
    where: { active: true },
    include: {
      versions: {
        orderBy: { appliedAt: "desc" },
        take: 1,
      },
    },
  });
  return catalogue?.versions[0] ?? null;
}

export async function listCatalogueVersions(limit = 20) {
  return prisma.ndisPriceCatalogueVersion.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      catalogue: { select: { id: true, name: true, sourceLabel: true, active: true } },
      _count: { select: { prices: true } },
    },
  });
}

export async function getVersionById(versionId: string) {
  return prisma.ndisPriceCatalogueVersion.findUnique({
    where: { id: versionId },
    include: {
      catalogue: true,
      _count: { select: { prices: true, importJobs: true } },
    },
  });
}

export async function setActiveCatalogue(catalogueId: string) {
  await prisma.ndisPriceCatalogue.updateMany({ data: { active: false } });
  return prisma.ndisPriceCatalogue.update({
    where: { id: catalogueId },
    data: { active: true },
  });
}
