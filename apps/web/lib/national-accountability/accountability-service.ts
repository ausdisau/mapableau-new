import { Prisma } from "@prisma/client";

import { phase12Config } from "@/lib/config/phase12";
import { prisma } from "@/lib/prisma";

export async function publishAccountabilityReport(params: {
  periodLabel: string;
  title: string;
  summary: string;
  category: string;
  metrics?: Record<string, unknown>;
}) {
  if (!phase12Config.nationalAccountabilityPortalEnabled) {
    throw new Error("ACCOUNTABILITY_PORTAL_DISABLED");
  }
  return prisma.nationalAccountabilityPublication.create({
    data: {
      ...params,
      metricsJson: params.metrics
        ? (params.metrics as Prisma.InputJsonValue)
        : undefined,
      status: "published",
      publishedAt: new Date(),
    },
  });
}

export async function listPublicAccountabilityReports() {
  if (!phase12Config.nationalAccountabilityPortalEnabled) return [];
  return prisma.nationalAccountabilityPublication.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 30,
    select: {
      id: true,
      periodLabel: true,
      title: true,
      summary: true,
      category: true,
      metricsJson: true,
      publishedAt: true,
    },
  });
}
