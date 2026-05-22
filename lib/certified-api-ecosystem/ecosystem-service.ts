import { phase12Config } from "@/lib/config/phase12";
import { prisma } from "@/lib/prisma";

export async function listCertifiedApiEcosystem() {
  if (!phase12Config.certifiedApiEcosystemAtScaleEnabled) {
    return { disabled: true, entries: [] };
  }
  const entries = await prisma.certifiedApiEcosystemEntry.findMany({
    where: { status: "listed" },
    orderBy: { listedAt: "desc" },
    take: 50,
  });
  return { disabled: false, entries };
}

export async function addEcosystemEntry(params: {
  organisationId: string;
  appName: string;
  certificationTier?: string;
}) {
  if (!phase12Config.certifiedApiEcosystemAtScaleEnabled) {
    throw new Error("API_ECOSYSTEM_DISABLED");
  }
  return prisma.certifiedApiEcosystemEntry.create({
    data: {
      organisationId: params.organisationId,
      appName: params.appName,
      certificationTier: params.certificationTier ?? "standard",
      status: "listed",
      expiresAt: new Date(Date.now() + 365 * 86400000),
    },
  });
}
