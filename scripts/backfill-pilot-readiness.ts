/**
 * Backfill / report ControlledPilot readiness gaps.
 *
 * Usage: pnpm exec tsx scripts/backfill-pilot-readiness.ts --dry-run
 *
 * Artifact sample (artifacts/pilot-readiness-backfill.json):
 * {
 *   "dryRun": true,
 *   "pilotsScanned": 0,
 *   "missingAssurance": [],
 *   "emptyAllowlists": [],
 *   "limitedLiveWithoutFlag": []
 * }
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { prisma } from "@/lib/prisma";

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((a) => a !== "--"),
    allowPositionals: true,
    options: { "dry-run": { type: "boolean", default: true } },
  });
  const dryRun = values["dry-run"] !== false;

  const pilots = await prisma.controlledPilot.findMany();
  const missingAssurance: string[] = [];
  const emptyAllowlists: string[] = [];
  const limitedLiveWithoutFlag: string[] = [];

  for (const p of pilots) {
    if (
      (p.stage === "limited_live" || p.stage === "controlled_live") &&
      (!p.assuranceAssessmentId || !p.goLiveAssessmentId)
    ) {
      missingAssurance.push(p.id);
    }
    if (
      p.supportItemAllowlist.length === 0 ||
      p.fundingRouteAllowlist.length === 0
    ) {
      emptyAllowlists.push(p.id);
    }
    if (
      (p.stage === "limited_live" || p.stage === "controlled_live") &&
      !p.limitedLiveEnabled
    ) {
      limitedLiveWithoutFlag.push(p.id);
    }
  }

  const artifact = {
    dryRun,
    pilotsScanned: pilots.length,
    missingAssurance,
    emptyAllowlists,
    limitedLiveWithoutFlag,
    note: "Read-only readiness report; no mutations in dry-run.",
  };
  const dir = path.join(process.cwd(), "artifacts");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "pilot-readiness-backfill.json");
  await writeFile(file, JSON.stringify(artifact, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: file, pilotsScanned: pilots.length }));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
