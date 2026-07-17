/**
 * Static audit: flag prisma findMany calls in the API tree that DO NOT include
 * an obvious `where:` referencing `organisationId`, `participantId`, or
 * `userId`. This is heuristic; it does not replace human review.
 */
import fs from "node:fs";
import path from "node:path";

import { parseArgs, writeArtifact, ts } from "./_shared";

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  const target = path.join(process.cwd(), "app", "api");
  const files = walk(target);
  const findings: { file: string; snippet: string }[] = [];

  const findManyRegex = /prisma\.[a-zA-Z_]+\.findMany\s*\(([\s\S]*?)\)/g;
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    let match: RegExpExecArray | null;
    while ((match = findManyRegex.exec(content))) {
      const args = match[1];
      const hasWhere = /where\s*:/.test(args);
      const hasScope =
        /organisationId|participantId|userId|assignedOrganisationId|__platform_unscoped_denied__/.test(
          args
        );
      if (!hasWhere || !hasScope) {
        findings.push({
          file: path.relative(process.cwd(), file),
          snippet: match[0].slice(0, 160),
        });
      }
    }
  }
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    findings,
    count: findings.length,
    note:
      "Heuristic scan. False positives possible. Any true positives touching participant/worker/claim data are Wave 8 blockers.",
  };
  const outFile = writeArtifact(
    "tenancy",
    `audit-unscoped-queries-${ts()}.json`,
    report
  );
  console.log(`unscoped_query_findings: ${report.count}`);
  console.log(`report: ${outFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
