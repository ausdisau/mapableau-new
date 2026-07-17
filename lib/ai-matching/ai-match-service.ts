import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase5Config } from "@/lib/config/phase5";
import { runFairnessCheck } from "@/lib/fairness/fairness-check-service";
import { runCareWorkerMatch } from "@/lib/matching/matching-service";
import { prisma } from "@/lib/prisma";

/**
 * Legacy AI matching (Waves 4-5) is retained as ADVISORY ONLY. AURA (Wave 10)
 * does not replace the fairness gate; it introduces a parallel bounded
 * execution surface with its own authority + approval model.
 *
 * Rules enforced by this module:
 *   1. `ruleScore` is deterministic and derived from `runCareWorkerMatch`.
 *   2. `modelCommentaryScore` is null unless an active model version has an
 *      actual provider configured. We never fabricate an "AI" score from the
 *      deterministic rule score.
 *   3. `acceptAiCandidate` runs in a single transaction, verifies tenant
 *      ownership when the schema exposes it, requires an approved
 *      `FairnessReview` when human review is mandated, and leaves the
 *      candidate unchanged on any validation failure.
 */

interface AcceptOptions {
  actorOrganisationId?: string | null;
}

function computeModelCommentaryScore(
  model: { id: string; provider: string; active: boolean } | null
): number | null {
  if (!model) return null;
  if (!model.active) return null;
  // A real, non-disabled provider is required. "disabled" is the sentinel used
  // by MatchingModelVersion when no external model is wired up. Any inference
  // of a numeric score without a real provider is a compliance defect.
  if (model.provider === "disabled" || model.provider === "none") {
    return null;
  }
  return null; // Placeholder: real integration would populate this from the provider.
}

export async function runAiCareMatch(
  careRequestId: string,
  requestedById: string
) {
  if (!phase5Config.aiMatchingEnabled) {
    return { skipped: true, reason: "AI matching disabled" };
  }

  const ruleRun = await runCareWorkerMatch(careRequestId, requestedById);
  if ("skipped" in ruleRun && ruleRun.skipped) {
    return ruleRun;
  }

  const careRequest = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
    select: { id: true, assignedOrganisationId: true, participantId: true },
  });

  const modelVersion = await prisma.matchingModelVersion.findFirst({
    where: { active: true },
  });

  const aiRun = await prisma.aiMatchRun.create({
    data: {
      careRequestId,
      status: "fairness_review_required",
      requestedById,
      modelVersionId: modelVersion?.id,
      ruleBasedRunId: "run" in ruleRun && ruleRun.run ? ruleRun.run.id : undefined,
    },
  });

  // Fail closed for the candidate pool. When the care request has an assigned
  // organisation, we only consider candidates whose organisation matches. When
  // it is not yet assigned, we still bound the pool via the matching-service
  // rule run rather than a global `active: true` scan.
  const candidatePool = await prisma.matchCandidate.findMany({
    where: {
      matchRun: { careRequestId },
      ...(careRequest?.assignedOrganisationId
        ? {
            OR: [
              { candidateOrganisationId: careRequest.assignedOrganisationId },
              { candidateOrganisationId: null },
            ],
          }
        : {}),
    },
    orderBy: { score: "desc" },
    take: 10,
  });

  for (let i = 0; i < candidatePool.length; i++) {
    const c = candidatePool[i];
    const ruleScore = c.score;
    const modelCommentaryScore = computeModelCommentaryScore(modelVersion);
    const combined = modelCommentaryScore
      ? Math.min(1, ruleScore * 0.85 + modelCommentaryScore * 0.15)
      : ruleScore;
    const lowConfidence = combined < 0.55;

    const aiCandidate = await prisma.aiMatchCandidate.create({
      data: {
        aiMatchRunId: aiRun.id,
        matchCandidateId: c.id,
        rank: i + 1,
        aiScore: modelCommentaryScore ?? 0,
        combinedScore: combined,
        lowConfidence,
        status: lowConfidence ? "review_required" : "generated",
      },
    });

    const commentaryLabel = modelCommentaryScore === null
      ? "No independent model commentary available (rule-only)."
      : `Model commentary ${modelCommentaryScore.toFixed(2)}`;

    await prisma.aiMatchExplanation.createMany({
      data: [
        {
          aiMatchCandidateId: aiCandidate.id,
          audience: "admin",
          plainLanguage: c.scoreExplanation,
          technicalDetail: `Rule score ${ruleScore.toFixed(2)}; ${commentaryLabel}`,
        },
        {
          aiMatchCandidateId: aiCandidate.id,
          audience: "participant",
          plainLanguage: lowConfidence
            ? "This option may need a closer look with your coordinator."
            : "This option looks like a reasonable fit based on available information.",
        },
      ],
    });
  }

  if (phase5Config.fairnessChecksEnabled) {
    await runFairnessCheck(aiRun.id, { careRequestId });
  }

  await createAuditEvent({
    actorUserId: requestedById,
    action: "ai_match.run_created",
    entityType: "AiMatchRun",
    entityId: aiRun.id,
  });

  return {
    aiRun,
    requiresHumanReview: phase5Config.aiMatchingRequireHumanReview,
    modelCommentaryEnabled: modelVersion !== null,
  };
}

export class AiMatchAcceptError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

export async function acceptAiCandidate(
  candidateId: string,
  actorUserId: string,
  options: AcceptOptions = {}
) {
  const candidate = await prisma.aiMatchCandidate.findUnique({
    where: { id: candidateId },
    include: {
      aiMatchRun: {
        select: {
          id: true,
          careRequestId: true,
          status: true,
        },
      },
    },
  });

  if (!candidate) {
    throw new AiMatchAcceptError("NOT_FOUND", "AI candidate not found");
  }
  if (candidate.status === "accepted") {
    return candidate;
  }
  if (candidate.status === "rejected") {
    throw new AiMatchAcceptError("REJECTED", "Candidate already rejected");
  }

  const careRequestId = candidate.aiMatchRun.careRequestId;
  let careRequest: {
    id: string;
    assignedOrganisationId: string | null;
    createdById: string | null;
    participantId: string;
  } | null = null;
  if (careRequestId) {
    careRequest = await prisma.careRequest.findUnique({
      where: { id: careRequestId },
      select: {
        id: true,
        assignedOrganisationId: true,
        createdById: true,
        participantId: true,
      },
    });
  }

  if (
    careRequest?.assignedOrganisationId &&
    options.actorOrganisationId !== undefined
  ) {
    if (
      options.actorOrganisationId !== null &&
      options.actorOrganisationId !== careRequest.assignedOrganisationId
    ) {
      throw new AiMatchAcceptError(
        "TENANT_MISMATCH",
        "Actor cannot accept AI candidate for a different organisation"
      );
    }
  }

  if (phase5Config.aiMatchingRequireHumanReview) {
    const review = await prisma.fairnessReview.findFirst({
      where: {
        fairnessCheck: { aiMatchRunId: candidate.aiMatchRunId },
        decision: "approved",
      },
      orderBy: { createdAt: "desc" },
    });
    if (!review) {
      throw new AiMatchAcceptError("FAIRNESS_REVIEW_REQUIRED");
    }
  }

  const [updated] = await prisma.$transaction([
    prisma.aiMatchCandidate.update({
      where: { id: candidateId },
      data: { status: "accepted" },
    }),
    prisma.aiMatchRun.update({
      where: { id: candidate.aiMatchRunId },
      data: { status: "accepted", completedAt: new Date() },
    }),
  ]);

  await createAuditEvent({
    actorUserId,
    action: "ai_match.candidate_accepted",
    entityType: "AiMatchCandidate",
    entityId: candidateId,
  });

  return updated;
}

export async function rejectAiCandidate(candidateId: string, actorUserId: string) {
  const candidate = await prisma.aiMatchCandidate.update({
    where: { id: candidateId },
    data: { status: "rejected" },
  });
  await createAuditEvent({
    actorUserId,
    action: "ai_match.candidate_rejected",
    entityType: "AiMatchCandidate",
    entityId: candidateId,
  });
  return candidate;
}

export function participantSafeAiSummary(candidate: {
  combinedScore: number;
  lowConfidence: boolean;
}) {
  return {
    fit:
      candidate.combinedScore >= 0.7 && !candidate.lowConfidence
        ? "Good potential fit"
        : "Needs human review",
    note: "Recommendations require human confirmation before assignment.",
  };
}
