import { prisma } from "@/lib/prisma";

export async function listCatalogueEntries() {
  return prisma.serviceCatalogueEntry.findMany({
    where: { active: true },
    orderBy: [{ criticality: "asc" }, { domain: "asc" }, { name: "asc" }],
  });
}

export async function upsertCatalogueEntry(input: {
  serviceKey: string;
  name: string;
  domain: "care" | "transport" | "billing" | "identity" | "integrations" | "observability" | "platform" | "data" | "ai" | "workforce" | "compliance";
  criticality: "critical" | "high" | "medium" | "low";
  ownerTeam?: string;
  runbookUrl?: string;
  slosJson?: unknown;
  dependencies?: string[];
}) {
  return prisma.serviceCatalogueEntry.upsert({
    where: { serviceKey: input.serviceKey },
    create: {
      serviceKey: input.serviceKey,
      name: input.name,
      domain: input.domain,
      criticality: input.criticality,
      ownerTeam: input.ownerTeam,
      runbookUrl: input.runbookUrl,
      slosJson: (input.slosJson as never) ?? undefined,
      dependencies: input.dependencies ?? [],
    },
    update: {
      name: input.name,
      domain: input.domain,
      criticality: input.criticality,
      ownerTeam: input.ownerTeam,
      runbookUrl: input.runbookUrl,
      slosJson: (input.slosJson as never) ?? undefined,
      dependencies: input.dependencies ?? [],
    },
  });
}
