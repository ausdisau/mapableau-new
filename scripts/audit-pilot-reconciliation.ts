/**
 * Audit pilot financial reconciliation posture.
 *
 * Artifact: artifacts/pilot-reconciliation-audit.json
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

  let findings: Array<{ code: string; detail: string }> = [];
  let databaseAvailable = true;

  try {
    const active = await prisma.controlledPilot.count({
      where: { status: "active", stage: { in: ["limited_live", "controlled_live"] } },
    });
    if (active > 0) {
      findings.push({
        code: "LIVE_STAGE_REQUIRES_DAILY_RECONCILIATION",
        detail: `${active} pilot(s) in live financial stages — daily reconciliation mandatory`,
      });
    }
  } catch (err) {
    databaseAvailable = false;
    if (!dryRun) throw err;
    findings.push({
      code: "DATABASE_UNAVAILABLE",
      detail: "Dry-run completed without database",
    });
  }

  findings.push({
    code: "ACCEPTED_IS_NOT_PAID",
    detail: "Acknowledgement/acceptance must never mark paid without reconciliation",
  });

  const artifact = {
    dryRun,
    databaseAvailable,
    findings,
    scannedAt: new Date().toISOString(),
  };
  const dir = path.join(process.cwd(), "artifacts");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "pilot-reconciliation-audit.json");
  await writeFile(file, JSON.stringify(artifact, null, 2) + "\n");
  console.log(
    JSON.stringify({ wrote: file, findingCount: findings.length, databaseAvailable })
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
