import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  consciousnessEvidenceSchema,
  consciousnessIndicatorSchema,
  consciousnessResearchAssessmentSchema,
  consciousnessTheorySchema,
  humanAttributionAssessmentSchema,
  systemIndicatorAssessmentSchema,
  type ConsciousnessEvidence,
  type ConsciousnessIndicator,
  type ConsciousnessResearchAssessment,
  type ConsciousnessTheory,
  type HumanAttributionAssessment,
  type SystemIndicatorAssessment,
} from "@/intelligence/research/maco/types";

const researchSourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  doi: z.string().min(1).nullable().optional(),
  pmid: z.string().min(1).nullable().optional(),
  arxivId: z.string().min(1).nullable().optional(),
  canonicalUrl: z.string().url().nullable().optional(),
  publicationStatus: z.enum([
    "peer_reviewed",
    "preprint",
    "review",
    "commentary",
    "other",
  ]),
  publishedAt: z.string().datetime().nullable().optional(),
});

export type MacoResearchSourceInput = z.infer<typeof researchSourceSchema>;

function normalizeIdentifier(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeDoi(value: string | null | undefined): string | null {
  return normalizeIdentifier(value)?.toLowerCase() ?? null;
}

export async function upsertResearchSource(input: MacoResearchSourceInput) {
  const parsed = researchSourceSchema.parse(input);
  const doi = normalizeDoi(parsed.doi);
  const pmid = normalizeIdentifier(parsed.pmid);
  const arxivId = normalizeIdentifier(parsed.arxivId);

  const identity = [
    ...(doi ? [{ doi }] : []),
    ...(pmid ? [{ pmid }] : []),
    ...(arxivId ? [{ arxivId }] : []),
  ];

  const existing = identity.length
    ? await prisma.macoResearchSource.findFirst({ where: { OR: identity } })
    : null;

  const data = {
    title: parsed.title,
    doi,
    pmid,
    arxivId,
    canonicalUrl: parsed.canonicalUrl ?? null,
    publicationStatus: parsed.publicationStatus,
    publishedAt: parsed.publishedAt ? new Date(parsed.publishedAt) : null,
  };

  if (existing) {
    return prisma.macoResearchSource.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.macoResearchSource.upsert({
    where: { id: parsed.id },
    create: { id: parsed.id, ...data },
    update: data,
  });
}

export async function upsertTheory(input: ConsciousnessTheory) {
  const parsed = consciousnessTheorySchema.parse(input);
  return prisma.macoConsciousnessTheory.upsert({
    where: {
      theoryKey_version: {
        theoryKey: parsed.id,
        version: parsed.version,
      },
    },
    create: {
      theoryKey: parsed.id,
      version: parsed.version,
      name: parsed.name,
      theoryFamily: parsed.theoryFamily,
      summary: parsed.summary,
      computationalApplicability: parsed.computationalApplicability,
      sourceIds: parsed.sourceIds,
    },
    update: {
      name: parsed.name,
      theoryFamily: parsed.theoryFamily,
      summary: parsed.summary,
      computationalApplicability: parsed.computationalApplicability,
      sourceIds: parsed.sourceIds,
    },
  });
}

export async function upsertIndicator(input: ConsciousnessIndicator) {
  const parsed = consciousnessIndicatorSchema.parse(input);
  return prisma.macoConsciousnessIndicator.upsert({
    where: {
      indicatorKey_version: {
        indicatorKey: parsed.id,
        version: parsed.version,
      },
    },
    create: {
      indicatorKey: parsed.id,
      version: parsed.version,
      theoryIds: parsed.theoryIds,
      name: parsed.name,
      operationalDefinition: parsed.operationalDefinition,
      evidenceRequired: parsed.evidenceRequired,
      knownConfounds: parsed.knownConfounds,
      status: parsed.status,
    },
    update: {
      theoryIds: parsed.theoryIds,
      name: parsed.name,
      operationalDefinition: parsed.operationalDefinition,
      evidenceRequired: parsed.evidenceRequired,
      knownConfounds: parsed.knownConfounds,
      status: parsed.status,
    },
  });
}

export async function recordEvidence(input: ConsciousnessEvidence) {
  const parsed = consciousnessEvidenceSchema.parse(input);
  const data = {
    sourceId: parsed.sourceId,
    indicatorIds: parsed.indicatorIds,
    direction: parsed.direction,
    publicationStatus: parsed.publicationStatus,
    methodSummary: parsed.methodSummary,
    alternativeExplanations: parsed.alternativeExplanations,
    replicationStatus: parsed.replicationStatus,
    evidenceStrength: parsed.evidenceStrength,
    assessedAt: new Date(parsed.assessedAt),
  };

  return prisma.macoConsciousnessEvidence.upsert({
    where: { id: parsed.id },
    create: { id: parsed.id, ...data },
    update: data,
  });
}

export async function recordSystemAssessment(
  input: SystemIndicatorAssessment,
) {
  const parsed = systemIndicatorAssessmentSchema.parse(input);
  const data = {
    architectureEvidenceIds: parsed.architectureEvidenceIds,
    experimentEvidenceIds: parsed.experimentEvidenceIds,
    observedStatus: parsed.observedStatus,
    mimicryRisk: parsed.mimicryRisk,
    confidence: parsed.confidence,
    limitations: parsed.limitations,
  };

  return prisma.macoSystemIndicatorAssessment.upsert({
    where: {
      systemId_systemVersion_indicatorId: {
        systemId: parsed.systemId,
        systemVersion: parsed.systemVersion,
        indicatorId: parsed.indicatorId,
      },
    },
    create: {
      systemId: parsed.systemId,
      systemVersion: parsed.systemVersion,
      indicatorId: parsed.indicatorId,
      ...data,
    },
    update: data,
  });
}

export async function recordResearchAssessment(
  input: ConsciousnessResearchAssessment,
) {
  const parsed = consciousnessResearchAssessmentSchema.parse(input);
  const data = {
    systemId: parsed.systemId,
    systemVersion: parsed.systemVersion,
    theoryCoverage: parsed.theoryCoverage,
    positiveIndicatorIds: parsed.positiveIndicatorIds,
    negativeIndicatorIds: parsed.negativeIndicatorIds,
    uncertainIndicatorIds: parsed.uncertainIndicatorIds,
    functionalSelfModelEvidence: parsed.functionalSelfModelEvidence,
    metacognitionEvidence: parsed.metacognitionEvidence,
    introspectionEvidence: parsed.introspectionEvidence,
    agencyEvidence: parsed.agencyEvidence,
    embodimentEvidence: parsed.embodimentEvidence,
    phenomenalConsciousnessEvidence: parsed.phenomenalConsciousnessEvidence,
    supportingSourceIds: parsed.supportingSourceIds,
    counterSourceIds: parsed.counterSourceIds,
    overallUncertainty: parsed.overallUncertainty,
    personhoodReviewRecommended: parsed.personhoodReviewRecommended,
    rationale: parsed.rationale,
  };

  return prisma.macoConsciousnessResearchAssessment.upsert({
    where: { id: parsed.id },
    create: { id: parsed.id, ...data },
    update: data,
  });
}

export async function recordAttributionAssessment(
  input: HumanAttributionAssessment,
) {
  const parsed = humanAttributionAssessmentSchema.parse(input);
  return prisma.macoHumanAttributionAssessment.create({
    data: {
      systemId: parsed.systemId,
      systemVersion: parsed.systemVersion,
      anthropomorphicCues: parsed.anthropomorphicCues,
      dependencyRisks: parsed.dependencyRisks,
      misleadingSelfPresentationRisks:
        parsed.misleadingSelfPresentationRisks,
      relationalSafetyControls: parsed.relationalSafetyControls,
      humanReviewRequired: parsed.humanReviewRequired,
    },
  });
}

export async function listEvidenceForIndicator(indicatorId: string) {
  return prisma.macoConsciousnessEvidence.findMany({
    where: { indicatorIds: { has: indicatorId } },
    orderBy: { assessedAt: "asc" },
  });
}
