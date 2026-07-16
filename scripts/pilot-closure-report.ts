/**
 * Generate ControlledPilot closure / board reports.
 *
 * Artifact sample (artifacts/pilot-closure-report.json):
 * { "dryRun": true, "reports": { "board": {}, "closure": {} } }
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { generatePilotReports } from "@/lib/pilot/reporting/pilot-report-service";

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      pilotId: { type: "string" },
      "dry-run": { type: "boolean", default: true },
    },
  });
  const dryRun = values["dry-run"] !== false;
  const pilotId = values.pilotId;
  if (!pilotId) throw new Error("--pilotId is required");

  const reports = await generatePilotReports(pilotId);
  const artifact = { dryRun, pilotId, reports };
  const dir = path.join(process.cwd(), "artifacts");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "pilot-closure-report.json");
  await writeFile(file, JSON.stringify(artifact, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: file, dryRun }));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
