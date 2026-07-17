/**
 * Audit runtime worker eligibility gaps for ControlledPilot.
 *
 * Artifact: artifacts/runtime-worker-eligibility-audit.json
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

  let findings: Array<{ code: string; detail: string; pilotId?: string }> = [];
  let databaseAvailable = true;

  try {
    const authRows = await prisma.pilotWorkerAuthorisation.findMany({
      where: { active: true },
      take: 500,
    });
    for (const row of authRows) {
      if (row.revokedAt) {
        findings.push({
          code: "ACTIVE_BUT_REVOKED",
          detail: "Worker remains marked active while revokedAt is set",
          pilotId: row.pilotId,
        });
      }
    }
  } catch (err) {
    databaseAvailable = false;
    if (!dryRun) throw err;
    findings.push({
      code: "DATABASE_UNAVAILABLE",
      detail: "Dry-run completed without database — runtime gate code still fails closed",
    });
  }

  findings.push({
    code: "CACHE_NOT_AUTHORITATIVE",
    detail: "Worker eligibility must revalidate at booking, dispatch, and billable creation",
  });

  const artifact = {
    dryRun,
    databaseAvailable,
    findings,
    scannedAt: new Date().toISOString(),
  };
  const dir = path.join(process.cwd(), "artifacts");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "runtime-worker-eligibility-audit.json");
  await writeFile(file, JSON.stringify(artifact, null, 2) + "\n");
  console.log(
    JSON.stringify({ wrote: file, findingCount: findings.length, databaseAvailable })
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
