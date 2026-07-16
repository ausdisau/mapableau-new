/**
 * Audit active pilots for missing worker authorisations.
 *
 * Artifact sample (artifacts/pilot-worker-eligibility-audit.json):
 * { "dryRun": true, "pilotsWithoutWorkers": ["..."] }
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
    where: { status: "active" },
    include: {
      workerAuthorisations: { where: { active: true } },
    },
  });

  const pilotsWithoutWorkers = pilots
    .filter((p) => p.workerAuthorisations.length === 0)
    .map((p) => p.id);

  const artifact = {
    dryRun,
    pilotsWithoutWorkers,
    scanned: pilots.length,
  };
  const dir = path.join(process.cwd(), "artifacts");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "pilot-worker-eligibility-audit.json");
  await writeFile(file, JSON.stringify(artifact, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: file, flagged: pilotsWithoutWorkers.length }));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
