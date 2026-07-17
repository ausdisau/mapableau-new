import { runIsolationAudit } from "@/lib/tenancy/storage/isolation-audit";

import { parseArgs, writeArtifact, ts } from "./_shared";

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  const findings = await runIsolationAudit();
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    findings,
    summary: {
      total: findings.length,
      warnings: findings.filter((f) => f.status === "warning").length,
      empty: findings.filter((f) => f.status === "empty").length,
      ok: findings.filter((f) => f.status === "ok").length,
    },
  };
  const file = writeArtifact("tenancy", `audit-isolation-${ts()}.json`, report);
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
