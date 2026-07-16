/**
 * Operational health snapshot across active pilots.
 *
 * Artifact sample (artifacts/pilot-operational-health.json):
 * { "dryRun": true, "pilots": [{ "pilotId": "...", "openSignals": 0, "activeShifts": 1 }] }
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { buildOperationalSnapshot } from "@/lib/pilot/operations/operational-snapshot";
import { prisma } from "@/lib/prisma";

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: { "dry-run": { type: "boolean", default: true } },
  });
  const dryRun = values["dry-run"] !== false;
  const pilots = await prisma.controlledPilot.findMany({
    where: { status: { in: ["active", "paused", "draining"] } },
  });
  const snapshots = [];
  for (const p of pilots) {
    snapshots.push(await buildOperationalSnapshot(p.id));
  }
  const artifact = { dryRun, pilots: snapshots, scannedAt: new Date().toISOString() };
  const dir = path.join(process.cwd(), "artifacts");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "pilot-operational-health.json");
  await writeFile(file, JSON.stringify(artifact, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: file, count: snapshots.length }));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
