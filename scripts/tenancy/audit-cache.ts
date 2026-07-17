/**
 * Cache audit — flags any `cache-control: public` responses in the API tree
 * that could carry per-tenant data. Best-effort static scan.
 */
import fs from "node:fs";
import path from "node:path";

import { parseArgs, writeArtifact, ts } from "./_shared";

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  const files = walk(path.join(process.cwd(), "app", "api"));
  const findings: string[] = [];
  for (const f of files) {
    const c = fs.readFileSync(f, "utf8");
    if (/cache-control["'\s:]+public/i.test(c)) {
      findings.push(path.relative(process.cwd(), f));
    }
  }
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    findings,
    pass: findings.length === 0,
  };
  const file = writeArtifact("tenancy", `audit-cache-${ts()}.json`, report);
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
