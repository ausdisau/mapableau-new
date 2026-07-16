/**
 * Evaluate ControlledPilot progression readiness.
 *
 * Usage:
 *   pnpm pilot:evaluate -- --pilotId=<id> [--dry-run]
 *
 * Artifact sample (artifacts/pilot-evaluate.json):
 * {
 *   "dryRun": true,
 *   "pilotId": "...",
 *   "canAdvance": false,
 *   "blockers": ["LIMITED_LIVE_DISABLED_BY_DEFAULT"],
 *   "recommendedNextStage": "limited_live"
 * }
 */
import { parseArgs } from "node:util";

import { evaluatePilotProgression } from "@/lib/pilot/progression/progression-evaluator";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      pilotId: { type: "string" },
      "dry-run": { type: "boolean", default: false },
    },
  });
  const dryRun = Boolean(values["dry-run"]);
  const pilotId = values.pilotId;
  if (!pilotId) {
    throw new Error("--pilotId is required");
  }

  const pilot = await prisma.controlledPilot.findUniqueOrThrow({
    where: { id: pilotId },
  });
  const evaluation = await evaluatePilotProgression({
    pilotId: pilot.id,
    status: pilot.status,
    stage: pilot.stage,
    limitedLiveEnabled: pilot.limitedLiveEnabled,
    assuranceAssessmentId: pilot.assuranceAssessmentId,
    goLiveAssessmentId: pilot.goLiveAssessmentId,
  });

  const artifact = {
    dryRun,
    pilotId,
    canAdvance: evaluation.canAdvance,
    blockers: evaluation.blockers,
    recommendedNextStage: evaluation.recommendedNextStage,
    evidence: evaluation.evidence,
  };

  const dir = path.join(process.cwd(), "artifacts");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "pilot-evaluate.json");
  await writeFile(file, JSON.stringify(artifact, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: file, dryRun, canAdvance: evaluation.canAdvance }));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
