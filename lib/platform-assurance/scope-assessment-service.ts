import type {
  DigitalPlatformScopeAssessment,
  PlatformScopeResult,
  ScopeAssessmentStatus,
} from "@prisma/client";
import { z } from "zod";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import {
  SCOPE_QUESTIONNAIRE_VERSION,
  suggestScopeResult,
  type ScopeAnswers,
} from "./scope-questionnaire";
import { ensureRegulatorySourcesSeeded } from "./source-registry";

const answerValueSchema = z.enum(["yes", "no", "unknown", "not_applicable"]);

export const createScopeAssessmentSchema = z.object({
  functionName: z.string().min(2).max(200),
  functionDescription: z.string().max(4000).optional(),
  moduleKeys: z.array(z.string().max(100)).max(40).default([]),
  sourceVersionId: z.string().min(1),
  answers: z.record(z.string(), answerValueSchema).default({}),
  evidenceRefs: z
    .array(
      z.object({
        label: z.string().max(200),
        uri: z.string().max(2000).optional(),
        note: z.string().max(2000).optional(),
      })
    )
    .max(50)
    .default([]),
  /** Callers may store a suggested result; legal finalisation is a separate role action. */
  result: z
    .enum([
      "likely_in_scope",
      "likely_out_of_scope",
      "mixed_function_review_required",
      "insufficient_evidence",
      "legal_review_required",
    ])
    .optional(),
});

export type CreateScopeAssessmentInput = z.infer<
  typeof createScopeAssessmentSchema
>;

/**
 * Final legal conclusion states require an explicit legal reviewer assignment.
 * Assurance officers may only store draft/suggested opinion states.
 */
export function assertMaySetScopeResult(params: {
  result: PlatformScopeResult;
  isLegalReviewer: boolean;
  status: ScopeAssessmentStatus;
}): void {
  if (params.result === "legal_review_required") {
    return;
  }
  if (
    (params.result === "likely_in_scope" ||
      params.result === "likely_out_of_scope") &&
    !params.isLegalReviewer
  ) {
    throw new Error("LEGAL_REVIEWER_REQUIRED_FOR_SCOPE_OPINION");
  }
  if (params.status === "closed" && !params.isLegalReviewer) {
    throw new Error("LEGAL_REVIEWER_REQUIRED_TO_CLOSE");
  }
}

export async function listScopeAssessments() {
  return prisma.digitalPlatformScopeAssessment.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { sourceVersion: true },
  });
}

export async function getScopeAssessment(id: string) {
  return prisma.digitalPlatformScopeAssessment.findUnique({
    where: { id },
    include: { sourceVersion: true },
  });
}

export async function createScopeAssessment(params: {
  input: CreateScopeAssessmentInput;
  actorUserId: string;
  isLegalReviewer: boolean;
}): Promise<DigitalPlatformScopeAssessment> {
  await ensureRegulatorySourcesSeeded();

  const source = await prisma.regulatorySourceVersion.findUnique({
    where: { id: params.input.sourceVersionId },
  });
  if (!source) {
    throw new Error("REGULATORY_SOURCE_NOT_FOUND");
  }

  const answers = params.input.answers as ScopeAnswers;
  const suggested = suggestScopeResult(answers);
  let result = (params.input.result ?? suggested) as PlatformScopeResult;

  // Non-legal reviewers cannot finalise in/out-of-scope opinions.
  if (
    !params.isLegalReviewer &&
    (result === "likely_in_scope" || result === "likely_out_of_scope")
  ) {
    result = "legal_review_required";
  }
  if (!params.isLegalReviewer && suggested === "legal_review_required") {
    result = "legal_review_required";
  }

  assertMaySetScopeResult({
    result,
    isLegalReviewer: params.isLegalReviewer,
    status: "draft",
  });

  const assessment = await prisma.digitalPlatformScopeAssessment.create({
    data: {
      functionName: params.input.functionName,
      functionDescription: params.input.functionDescription,
      moduleKeys: params.input.moduleKeys,
      sourceVersionId: params.input.sourceVersionId,
      answersJson: {
        questionnaireVersion: SCOPE_QUESTIONNAIRE_VERSION,
        answers,
        suggestedResult: suggested,
      },
      evidenceRefsJson: params.input.evidenceRefs,
      result,
      status: result === "legal_review_required" ? "legal_review" : "draft",
      reviewerUserId: params.actorUserId,
      createdByUserId: params.actorUserId,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "platform_assurance.scope_assessment_created",
    entityType: "DigitalPlatformScopeAssessment",
    entityId: assessment.id,
    metadata: {
      functionName: assessment.functionName,
      result: assessment.result,
      sourceVersionId: assessment.sourceVersionId,
      questionnaireVersion: SCOPE_QUESTIONNAIRE_VERSION,
      disclaimer:
        "Not a legal classification; MapAble has not declared registration status.",
    },
  });

  return assessment;
}

export async function buildAuditReadinessExport(assessmentId: string) {
  const assessment = await getScopeAssessment(assessmentId);
  if (!assessment) {
    throw new Error("SCOPE_ASSESSMENT_NOT_FOUND");
  }

  const controls = await prisma.registrationControl.findMany({
    orderBy: { code: "asc" },
  });

  return {
    exportedAt: new Date().toISOString(),
    disclaimer:
      "This pack is an internal readiness inventory. It is not a certificate of registration, audit opinion, or legal advice. MapAble has not declared NDIS digital platform registration or legal compliance.",
    assessment: {
      id: assessment.id,
      functionName: assessment.functionName,
      functionDescription: assessment.functionDescription,
      moduleKeys: assessment.moduleKeys,
      result: assessment.result,
      status: assessment.status,
      answersJson: assessment.answersJson,
      evidenceRefsJson: assessment.evidenceRefsJson,
      decisionDate: assessment.decisionDate,
      nextReviewAt: assessment.nextReviewAt,
    },
    sourceVersion: assessment.sourceVersion,
    controls,
  };
}
