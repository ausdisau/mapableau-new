import { prisma } from "@/lib/prisma";

export async function openRegulatoryChangeCase(input: {
  sourceKey: string;
  organisationId?: string | null;
  title: string;
  summary: string;
  effectiveAt?: Date | null;
}) {
  const source = await prisma.regulatorySource.findUnique({
    where: { key: input.sourceKey },
  });
  if (!source) {
    throw new Error(`REGULATORY_SOURCE_NOT_FOUND:${input.sourceKey}`);
  }
  return prisma.regulatoryChangeCase.create({
    data: {
      sourceId: source.id,
      organisationId: input.organisationId ?? null,
      title: input.title,
      summary: input.summary,
      status: "triage",
      effectiveAt: input.effectiveAt ?? null,
    },
  });
}

export async function assignRegulatoryHumanReviewer(input: {
  caseId: string;
  humanReviewerId: string;
}) {
  return prisma.regulatoryChangeCase.update({
    where: { id: input.caseId },
    data: {
      humanReviewerId: input.humanReviewerId,
      reviewedAt: null,
    },
  });
}

/**
 * Regulatory change cases MUST be reviewed by a named human. This helper
 * refuses to close a case without one.
 */
export async function closeRegulatoryChangeCase(input: {
  caseId: string;
  humanReviewerId: string;
  impactAssessment: string;
}) {
  if (!input.humanReviewerId) {
    throw new Error("REGULATORY_HUMAN_REVIEWER_REQUIRED");
  }
  if (!input.impactAssessment || input.impactAssessment.trim().length < 40) {
    throw new Error("REGULATORY_IMPACT_ASSESSMENT_TOO_SHORT");
  }
  return prisma.regulatoryChangeCase.update({
    where: { id: input.caseId },
    data: {
      status: "closed",
      humanReviewerId: input.humanReviewerId,
      reviewedAt: new Date(),
      impactAssessment: input.impactAssessment,
    },
  });
}
