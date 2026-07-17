import type { AiaStatus, DecisionImpact, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const AIA_REQUIRED_IMPACTS = new Set<DecisionImpact>([
  "rights_affecting",
  "safety_relevant",
  "financial",
  "legally_significant",
  "prohibited_for_automation",
]);

const AIA_TRANSITIONS: Record<AiaStatus, AiaStatus[]> = {
  draft: ["in_assessment", "retired"],
  in_assessment: ["under_review", "rejected", "retired"],
  under_review: ["approved", "conditional", "rejected", "retired"],
  approved: ["expired", "retired"],
  conditional: ["approved", "expired", "retired"],
  rejected: ["draft", "retired"],
  expired: ["in_assessment", "retired"],
  retired: [],
};

export type CreateAiaInput = {
  systemId: string;
  systemVersionId?: string;
  assessorId?: string;
  summary: string;
  rightsImpacts: Prisma.InputJsonValue;
  residualRisks: Prisma.InputJsonValue;
  evidenceRefs?: Prisma.InputJsonValue;
};

export function requiresAiaBeforePublish(impact: DecisionImpact): boolean {
  return AIA_REQUIRED_IMPACTS.has(impact);
}

export function canTransitionAia(from: AiaStatus, to: AiaStatus): boolean {
  return AIA_TRANSITIONS[from].includes(to);
}

export async function createDraftAia(input: CreateAiaInput) {
  return prisma.algorithmicImpactAssessment.create({
    data: {
      ...input,
      status: "draft",
    },
  });
}

export async function transitionAia(
  aiaId: string,
  to: AiaStatus,
  reviewerId?: string,
) {
  const aia = await prisma.algorithmicImpactAssessment.findUnique({
    where: { id: aiaId },
  });
  if (!aia) throw new Error("AIA_NOT_FOUND");
  if (!canTransitionAia(aia.status, to))
    throw new Error("INVALID_AIA_TRANSITION");

  return prisma.algorithmicImpactAssessment.update({
    where: { id: aiaId },
    data: {
      status: to,
      reviewerId: reviewerId ?? aia.reviewerId,
      approvedAt:
        to === "approved" || to === "conditional" ? new Date() : aia.approvedAt,
    },
  });
}

export async function expireAia(aiaId: string) {
  return transitionAia(aiaId, "expired");
}

export async function assertApprovedAiaForPublish(params: {
  systemId: string;
  systemVersionId?: string;
  impact: DecisionImpact;
  now?: Date;
}) {
  if (!requiresAiaBeforePublish(params.impact)) return;

  const now = params.now ?? new Date();
  const aia = await prisma.algorithmicImpactAssessment.findFirst({
    where: {
      systemId: params.systemId,
      systemVersionId: params.systemVersionId,
      status: { in: ["approved", "conditional"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { approvedAt: "desc" },
  });

  if (!aia) throw new Error("APPROVED_AIA_REQUIRED_BEFORE_PUBLICATION");
}
