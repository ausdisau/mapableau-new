import type { PilotReviewOutcome, Prisma } from "@prisma/client";

import { checklistComplete } from "@/lib/pilot/reviews/daily-review-checklist";
import { recommendReviewOutcome } from "@/lib/pilot/reviews/decision-support";
import { prisma } from "@/lib/prisma";

export async function submitDailyReview(input: {
  pilotId: string;
  reviewDate: Date;
  reviewedById: string;
  checklist: Record<string, boolean>;
  findings?: unknown[];
  notes?: string;
  outcome?: PilotReviewOutcome;
}) {
  const check = checklistComplete(input.checklist);
  const [critical, actions, limitSignals] = await Promise.all([
    prisma.pilotSafetySignal.count({
      where: { pilotId: input.pilotId, acknowledged: false, severity: "critical" },
    }),
    prisma.pilotCorrectiveAction.count({
      where: { pilotId: input.pilotId, status: { in: ["open", "in_progress"] } },
    }),
    prisma.pilotSafetySignal.count({
      where: {
        pilotId: input.pilotId,
        signalType: "limit_breach",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const recommendation = recommendReviewOutcome({
    openCriticalSignals: critical,
    openCorrectiveActions: actions,
    limitBreaches: limitSignals,
    checklistComplete: check.complete,
  });

  return prisma.pilotDailyReview.create({
    data: {
      pilotId: input.pilotId,
      reviewDate: input.reviewDate,
      outcome: input.outcome ?? recommendation.outcome,
      checklistJson: input.checklist as Prisma.InputJsonValue,
      findingsJson: (input.findings ?? [
        { recommendation: recommendation.rationale, missing: check.missing },
      ]) as Prisma.InputJsonValue,
      reviewedById: input.reviewedById,
      notes: input.notes,
    },
  });
}
