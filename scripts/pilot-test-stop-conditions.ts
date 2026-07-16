/**
 * Test stop-condition evaluation (dry-run capable).
 *
 * Artifact sample (artifacts/pilot-stop-conditions.json):
 * { "shouldStop": true, "reasons": ["CRITICAL_SIGNAL_THRESHOLD"] }
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { evaluateStopConditions } from "@/lib/pilot/safety/stop-condition-evaluator";
import { prisma } from "@/lib/prisma";

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
  if (!pilotId) throw new Error("--pilotId is required");

  const [critical, limitBreaches, incidents] = await Promise.all([
    prisma.pilotSafetySignal.count({
      where: { pilotId, severity: "critical", acknowledged: false },
    }),
    prisma.pilotSafetySignal.count({
      where: { pilotId, signalType: "limit_breach" },
    }),
    prisma.incidentReport.count({
      where: { pilotId, adminAcknowledgedAt: null },
    }),
  ]);

  const result = evaluateStopConditions({
    openCriticalSignals: critical,
    limitBreachCount: limitBreaches,
    unacknowledgedIncidents: incidents,
    maxCriticalSignals: 1,
    maxLimitBreaches: 1,
  });

  const artifact = { dryRun, pilotId, ...result };
  const dir = path.join(process.cwd(), "artifacts");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "pilot-stop-conditions.json");
  await writeFile(file, JSON.stringify(artifact, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: file, shouldStop: result.shouldStop }));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
