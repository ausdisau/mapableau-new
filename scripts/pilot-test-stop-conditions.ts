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
    args: process.argv.slice(2).filter((a) => a !== "--"),
    options: {
      pilotId: { type: "string" },
      "dry-run": { type: "boolean", default: true },
    },
    allowPositionals: true,
  });
  const dryRun = values["dry-run"] !== false;
  const pilotId = values.pilotId;

  // Offline/unit evaluation when no pilotId — proves policy without DB.
  if (!pilotId || dryRun) {
    const synthetic = evaluateStopConditions({
      openCriticalSignals: 2,
      limitBreachCount: 0,
      unacknowledgedIncidents: 0,
      maxCriticalSignals: 1,
      maxLimitBreaches: 1,
    });
    const clear = evaluateStopConditions({
      openCriticalSignals: 0,
      limitBreachCount: 0,
      unacknowledgedIncidents: 0,
      maxCriticalSignals: 1,
      maxLimitBreaches: 1,
    });
    const artifact = {
      dryRun: true,
      pilotId: pilotId ?? null,
      mode: "synthetic_policy",
      cases: { criticalExceeds: synthetic, clear },
    };
    const dir = path.join(process.cwd(), "artifacts");
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, "pilot-stop-conditions.json");
    await writeFile(file, JSON.stringify(artifact, null, 2) + "\n");
    console.log(
      JSON.stringify({
        wrote: file,
        shouldStop: synthetic.shouldStop,
        clearShouldStop: clear.shouldStop,
      })
    );
    if (!synthetic.shouldStop || clear.shouldStop) {
      throw new Error("STOP_CONDITION_POLICY_FAILED");
    }
    return;
  }

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

  const artifact = { dryRun: false, pilotId, ...result };
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
