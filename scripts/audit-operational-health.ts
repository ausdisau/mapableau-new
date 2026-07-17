/**
 * Audit operational health signals — flags alone are never "healthy".
 *
 * Artifact: artifacts/operational-health-audit.json
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((a) => a !== "--"),
    allowPositionals: true,
    options: { "dry-run": { type: "boolean", default: true } },
  });
  const dryRun = values["dry-run"] !== false;

  const findings: Array<{ code: string; detail: string; severity: string }> = [];

  if (process.env.PILOT_ENFORCEMENT_ENABLED !== "true") {
    findings.push({
      code: "ENFORCEMENT_OFF",
      severity: "attention",
      detail: "PILOT_ENFORCEMENT_ENABLED is not true",
    });
  }
  if (process.env.NDIA_PILOT_ENABLED === "true") {
    findings.push({
      code: "LEGACY_FLAG_NOT_HEALTH",
      severity: "attention",
      detail: "NDIA_PILOT_ENABLED must not imply operational readiness",
    });
  }
  if (process.env.NDIA_REAL_SUBMISSION_ENABLED === "true") {
    findings.push({
      code: "REAL_SUBMISSION_FLAG",
      severity: "critical",
      detail: "Real NDIA submission flag is on — ControlledPilot + Wave 2 approval still required",
    });
  }

  findings.push({
    code: "HEALTH_NOT_FROM_FLAGS",
    severity: "info",
    detail: "Command centre must use readiness, limits, queues, and safety signals — not feature flags alone",
  });

  const artifact = {
    dryRun,
    findings,
    scannedAt: new Date().toISOString(),
  };
  const dir = path.join(process.cwd(), "artifacts");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "operational-health-audit.json");
  await writeFile(file, JSON.stringify(artifact, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: file, findingCount: findings.length }));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
