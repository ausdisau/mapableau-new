/**
 * Audit code/config paths that could bypass ControlledPilot gates.
 *
 * Artifact sample (artifacts/pilot-bypass-audit.json):
 * { "dryRun": true, "findings": [{ "code": "ENFORCEMENT_OFF", "detail": "..." }] }
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: { "dry-run": { type: "boolean", default: true } },
  });
  const dryRun = values["dry-run"] !== false;
  const findings: Array<{ code: string; detail: string }> = [];

  if (process.env.PILOT_ENFORCEMENT_ENABLED !== "true") {
    findings.push({
      code: "ENFORCEMENT_OFF",
      detail: "PILOT_ENFORCEMENT_ENABLED is not true — prepare-payment pilot gates inactive",
    });
  }
  if (process.env.NDIA_REAL_SUBMISSION_ENABLED === "true") {
    findings.push({
      code: "NDIA_REAL_SUBMISSION_FLAG",
      detail: "NDIA_REAL_SUBMISSION_ENABLED=true — ensure claim-specific approval still required",
    });
  }

  findings.push({
    code: "GLOBAL_PILOT_RECORD",
    detail:
      "NdiaPilotApprovalRecord must never authorise claims or ControlledPilot operations",
  });

  const artifact = { dryRun, findings, scannedAt: new Date().toISOString() };
  const dir = path.join(process.cwd(), "artifacts");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "pilot-bypass-audit.json");
  await writeFile(file, JSON.stringify(artifact, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: file, findingCount: findings.length }));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
