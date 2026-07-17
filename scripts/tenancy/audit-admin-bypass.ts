/**
 * Static audit: greps for well-known admin-bypass patterns in critical files.
 * Fails the run (exit code 2) if any regressions are found.
 */
import fs from "node:fs";
import path from "node:path";

import { parseArgs, writeArtifact, ts } from "./_shared";

const FLAGGED_PATTERNS: { pattern: RegExp; description: string }[] = [
  {
    pattern: /if\s*\(\s*isAdminRole\([^)]+\)\s*\)\s*return\s*\{\s*\}\s*;?/,
    description: "silent admin bypass (return {})",
  },
];

// Files that would silently expand admin access across tenants — Wave 8 lockdown.
const TARGET_FILES = [
  "lib/api/phase3-scope.ts",
  "lib/care/access-control.ts",
];

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  const findings: { file: string; description: string; line?: string }[] = [];
  for (const rel of TARGET_FILES) {
    const abs = path.join(process.cwd(), rel);
    if (!fs.existsSync(abs)) continue;
    const content = fs.readFileSync(abs, "utf8");
    const lines = content.split(/\r?\n/);
    for (const { pattern, description } of FLAGGED_PATTERNS) {
      for (const line of lines) {
        if (pattern.test(line)) {
          findings.push({ file: rel, description, line: line.trim() });
        }
      }
    }
  }
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    findings,
    pass: findings.length === 0,
  };
  const file = writeArtifact("tenancy", `audit-admin-bypass-${ts()}.json`, report);
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
  if (!report.pass) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
