import { prisma } from "@/lib/prisma";

export async function listSnapshotsForAdmin(take = 50) {
  return prisma.accountabilityPublicationSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      approvals: { orderBy: { createdAt: "asc" } },
      _count: {
        select: { values: true, evidence: true, corrections: true, approvals: true },
      },
    },
  });
}

export async function getSnapshotForReview(id: string) {
  return prisma.accountabilityPublicationSnapshot.findUnique({
    where: { id },
    include: {
      approvals: { orderBy: { createdAt: "asc" } },
      values: {
        include: { metric: { include: { methodology: true } } },
        orderBy: { metric: { name: "asc" } },
      },
      evidence: {
        orderBy: { createdAt: "desc" },
      },
      corrections: true,
    },
  });
}

export async function listMetricsForAdmin() {
  return prisma.accountabilityMetric.findMany({
    orderBy: [{ domain: "asc" }, { name: "asc" }],
    include: { methodology: true },
  });
}

export async function listChallengesForAdmin() {
  return prisma.accountabilityPublicChallenge.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listCorrectionsForAdmin() {
  return prisma.accountabilityCorrection.findMany({
    orderBy: { correctionDate: "desc" },
    take: 100,
  });
}

export async function listDisclosurePolicies() {
  return prisma.accountabilityDisclosurePolicy.findMany({
    orderBy: { policyKey: "asc" },
  });
}
