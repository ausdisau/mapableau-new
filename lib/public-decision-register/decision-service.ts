import { phase9Config } from "@/lib/config/phase9";
import { prisma } from "@/lib/prisma";

export async function publishDecisionRecord(params: {
  title: string;
  summary: string;
  decisionType: string;
  rationale?: string;
}) {
  if (!phase9Config.publicDecisionRegisterEnabled) {
    throw new Error("DECISION_REGISTER_DISABLED");
  }
  return prisma.publicDecisionRecord.create({
    data: {
      ...params,
      status: "published",
      publishedAt: new Date(),
    },
  });
}

export async function listPublicDecisions() {
  if (!phase9Config.publicDecisionRegisterEnabled) return [];
  return prisma.publicDecisionRecord.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      summary: true,
      decisionType: true,
      rationale: true,
      publishedAt: true,
    },
  });
}
