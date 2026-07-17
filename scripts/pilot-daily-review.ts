/**
 * Submit or dry-run a daily review checklist evaluation.
 *
 * Artifact sample (artifacts/pilot-daily-review.json):
 * { "dryRun": true, "pilotId": "...", "recommendation": "continue" }
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { checklistComplete, DAILY_REVIEW_CHECKLIST } from "@/lib/pilot/reviews/daily-review-checklist";
import { recommendReviewOutcome } from "@/lib/pilot/reviews/decision-support";
import { submitDailyReview } from "@/lib/pilot/reviews/daily-review-service";
import { prisma } from "@/lib/prisma";

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      pilotId: { type: "string" },
      "dry-run": { type: "boolean", default: true },
      reviewedById: { type: "string" },
    },
  });
  const dryRun = values["dry-run"] !== false;
  const pilotId = values.pilotId;
  if (!pilotId) throw new Error("--pilotId is required");

  const checklist: Record<string, boolean> = {};
  for (const item of DAILY_REVIEW_CHECKLIST) {
    checklist[item.key] = true;
  }
  const check = checklistComplete(checklist);
  const critical = await prisma.pilotSafetySignal.count({
    where: { pilotId, severity: "critical", acknowledged: false },
  });
  const recommendation = recommendReviewOutcome({
    openCriticalSignals: critical,
    openCorrectiveActions: 0,
    limitBreaches: 0,
    checklistComplete: check.complete,
  });

  let reviewId: string | null = null;
  if (!dryRun) {
    if (!values.reviewedById) throw new Error("--reviewedById required when not dry-run");
    const review = await submitDailyReview({
      pilotId,
      reviewDate: new Date(),
      reviewedById: values.reviewedById,
      checklist,
      outcome: recommendation.outcome,
    });
    reviewId = review.id;
  }

  const artifact = {
    dryRun,
    pilotId,
    recommendation: recommendation.outcome,
    rationale: recommendation.rationale,
    reviewId,
  };
  const dir = path.join(process.cwd(), "artifacts");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "pilot-daily-review.json");
  await writeFile(file, JSON.stringify(artifact, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: file, recommendation: recommendation.outcome }));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
