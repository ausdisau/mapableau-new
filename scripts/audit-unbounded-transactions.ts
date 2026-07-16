/**
 * Audit pilots with zero/empty limits (unbounded = deny, but flag misconfig).
 *
 * Artifact sample (artifacts/pilot-unbounded-audit.json):
 * { "dryRun": true, "unboundedPilots": [{ "pilotId": "...", "issues": ["maxTransactionCents=0"] }] }
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { prisma } from "@/lib/prisma";

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: { "dry-run": { type: "boolean", default: true } },
  });
  const dryRun = values["dry-run"] !== false;
  const pilots = await prisma.controlledPilot.findMany({
    where: { status: { in: ["active", "approved", "paused"] } },
  });

  const unboundedPilots = pilots
    .map((p) => {
      const issues: string[] = [];
      if (p.maxTransactionCents <= 0) issues.push("maxTransactionCents=0");
      if (p.maxDailyExposureCents <= 0) issues.push("maxDailyExposureCents=0");
      if (p.maxTotalExposureCents <= 0) issues.push("maxTotalExposureCents=0");
      if (p.supportItemAllowlist.length === 0) issues.push("empty_supportItemAllowlist");
      if (p.fundingRouteAllowlist.length === 0) issues.push("empty_fundingRouteAllowlist");
      return { pilotId: p.id, code: p.code, issues };
    })
    .filter((p) => p.issues.length > 0);

  const artifact = { dryRun, unboundedPilots, scanned: pilots.length };
  const dir = path.join(process.cwd(), "artifacts");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "pilot-unbounded-audit.json");
  await writeFile(file, JSON.stringify(artifact, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: file, flagged: unboundedPilots.length }));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
