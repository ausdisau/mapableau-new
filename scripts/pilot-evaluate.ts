/**
 * Evaluate ControlledPilot progression readiness.
 *
 * Usage:
 *   pnpm pilot:evaluate -- --dry-run
 *   pnpm pilot:evaluate -- --pilotId=<id>
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
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { isLimitedLivePermitted } from "@/lib/pilot/policy/stage-policy";
import { evaluatePilotProgression } from "@/lib/pilot/progression/progression-evaluator";
import { prisma } from "@/lib/prisma";

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((a) => a !== "--"),
    allowPositionals: true,
    options: {
      pilotId: { type: "string" },
      "dry-run": { type: "boolean", default: true },
    },
  });
  const dryRun = values["dry-run"] !== false;
  const pilotId = values.pilotId;

  if (!pilotId || dryRun) {
    const liveCheck = isLimitedLivePermitted({
      stage: "limited_live",
      limitedLiveEnabled: false,
      assuranceAssessmentId: null,
      goLiveAssessmentId: null,
    });
    const blockers = [
      ...(liveCheck.ok ? [] : liveCheck.reasons),
      "SYNTHETIC_EVALUATION_NO_DB",
    ];
    const artifact = {
      dryRun: true,
      pilotId: pilotId ?? null,
      mode: "synthetic_policy",
      canAdvance: false,
      blockers,
      recommendedNextStage: "limited_live",
      evidence: null,
      notes: [
        "limited_live remains disabled by default",
        "Wave 6 assessment IDs are optional string refs until Wave 6 lands",
        "empty allowlists deny (fail closed)",
        "NdiaPilotApprovalRecord is not ControlledPilot authority",
      ],
    };
    const dir = path.join(process.cwd(), "artifacts");
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, "pilot-evaluate.json");
    await writeFile(file, JSON.stringify(artifact, null, 2) + "\n");
    console.log(
      JSON.stringify({
        wrote: file,
        dryRun: true,
        canAdvance: false,
        blockers,
      })
    );
    return;
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
    dryRun: false,
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
  console.log(
    JSON.stringify({ wrote: file, dryRun: false, canAdvance: evaluation.canAdvance })
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
