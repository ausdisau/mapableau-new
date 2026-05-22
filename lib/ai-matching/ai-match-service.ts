import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase5Config } from "@/lib/config/phase5";
import { runFairnessCheck } from "@/lib/fairness/fairness-check-service";
import { runCareWorkerMatch } from "@/lib/matching/matching-service";
import { prisma } from "@/lib/prisma";

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

  const candidates = await prisma.matchCandidate.findMany({
    where: { matchRun: { careRequestId } },
    orderBy: { score: "desc" },
    take: 10,
  });

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const aiScore = Math.min(1, c.score * 0.15 + 0.05);
    const combined = Math.min(1, c.score * 0.85 + aiScore);
    const lowConfidence = combined < 0.55;

    const aiCandidate = await prisma.aiMatchCandidate.create({
      data: {
        aiMatchRunId: aiRun.id,
        matchCandidateId: c.id,
        rank: i + 1,
        aiScore,
        combinedScore: combined,
        lowConfidence,
        status: lowConfidence ? "review_required" : "generated",
      },
    });

    await prisma.aiMatchExplanation.createMany({
      data: [
        {
          aiMatchCandidateId: aiCandidate.id,
          audience: "admin",
          plainLanguage: c.scoreExplanation,
          technicalDetail: `Rule score ${c.score.toFixed(2)}; AI assist ${aiScore.toFixed(2)}`,
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

  return { aiRun, requiresHumanReview: phase5Config.aiMatchingRequireHumanReview };
}

export async function acceptAiCandidate(
  candidateId: string,
  actorUserId: string
) {
  const candidate = await prisma.aiMatchCandidate.update({
    where: { id: candidateId },
    data: { status: "accepted" },
    include: { aiMatchRun: true },
  });

  if (phase5Config.aiMatchingRequireHumanReview) {
    const review = await prisma.fairnessReview.findFirst({
      where: { fairnessCheck: { aiMatchRunId: candidate.aiMatchRunId } },
    });
    if (!review) {
      throw new Error("FAIRNESS_REVIEW_REQUIRED");
    }
  }

  await prisma.aiMatchRun.update({
    where: { id: candidate.aiMatchRunId },
    data: { status: "accepted", completedAt: new Date() },
  });

  await createAuditEvent({
    actorUserId,
    action: "ai_match.candidate_accepted",
    entityType: "AiMatchCandidate",
    entityId: candidateId,
  });

  return candidate;
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
