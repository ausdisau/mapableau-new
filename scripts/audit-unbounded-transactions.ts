/**
 * Audit pilots with zero/empty limits (unbounded = deny, but flag misconfig).
 *
 * Artifact sample (artifacts/unbounded-transaction-audit.json):
 * { "dryRun": true, "unboundedPilots": [{ "pilotId": "...", "issues": ["maxTransactionCents=0"] }] }
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

  let unboundedPilots: Array<{ pilotId: string; issues: string[] }> = [];
  let databaseAvailable = true;

  try {
    const pilots = await prisma.controlledPilot.findMany({
      where: { status: { in: ["active", "approved", "paused"] } },
    });
    unboundedPilots = pilots
      .map((p) => {
        const issues: string[] = [];
        if (p.maxTransactionCents <= 0) issues.push("maxTransactionCents=0");
        if (p.maxDailyExposureCents <= 0) issues.push("maxDailyExposureCents=0");
        if (p.maxTotalExposureCents <= 0) issues.push("maxTotalExposureCents=0");
        if (p.supportItemAllowlist.length === 0)
          issues.push("empty_supportItemAllowlist");
        if (p.fundingRouteAllowlist.length === 0)
          issues.push("empty_fundingRouteAllowlist");
        return { pilotId: p.id, issues };
      })
      .filter((row) => row.issues.length > 0);
  } catch (err) {
    databaseAvailable = false;
    if (!dryRun) throw err;
  }

  const artifact = {
    dryRun,
    databaseAvailable,
    note: "Empty allowlists deny (fail closed). Zero caps also deny new transactions.",
    unboundedPilots,
    scannedAt: new Date().toISOString(),
  };
  const dir = path.join(process.cwd(), "artifacts");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "unbounded-transaction-audit.json");
  await writeFile(file, JSON.stringify(artifact, null, 2) + "\n");
  console.log(
    JSON.stringify({
      wrote: file,
      unboundedCount: unboundedPilots.length,
      databaseAvailable,
    })
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
