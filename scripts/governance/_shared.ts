import fs from "node:fs";
import path from "node:path";

import { CONSEQUENTIAL_SYSTEM_CATALOG } from "@/lib/public-interest-governance/catalog/consequential-systems";

export type GovernanceScriptName =
  | "audit-governed-systems"
  | "audit-consequential-decisions"
  | "audit-appeal-pathways"
  | "audit-governance-tenant-scope"
  | "audit-public-explanations"
  | "backfill-algorithm-register"
  | "governance-evaluate";

type GovernanceScriptDefinition = {
  name: GovernanceScriptName;
  summary: string;
  checks?: string[];
  live?: () => Promise<Record<string, unknown>>;
};

const GOVERNANCE_DISCLAIMERS = [
  "Register entry is not certification, endorsement or regulatory approval.",
  "Dry-runs never publish register entries automatically.",
  "No opaque scoring, automated regulator submissions or autonomous legal/clinical/safeguarding/financial decisions.",
  "Appeals must not retaliate against participants, advocates or reporters.",
  "Community recommendations are advisory by default.",
];

export function parseGovernanceArgs(argv: string[]) {
  return {
    dryRun: argv.includes("--dry-run") || argv.includes("-n"),
    json: argv.includes("--json"),
  };
}

export function writeGovernanceArtifact(name: string, payload: unknown) {
  const dir = path.join(process.cwd(), "artifacts", "governance");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `${name}-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  return file;
}

export function scanFiles(params: {
  roots: string[];
  extensions: string[];
  pattern: RegExp;
  ignore?: RegExp[];
}) {
  const hits: Array<{ file: string; line: number; snippet: string }> = [];
  const cwd = process.cwd();
  for (const root of params.roots) {
    walk(
      path.join(cwd, root),
      params.extensions,
      params.ignore ?? [],
      (file) => {
        const rel = path.relative(cwd, file);
        const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
        lines.forEach((line, index) => {
          if (params.pattern.test(line)) {
            hits.push({
              file: rel,
              line: index + 1,
              snippet: line.trim().slice(0, 240),
            });
          }
        });
      },
    );
  }
  return hits;
}

function walk(
  dir: string,
  extensions: string[],
  ignore: RegExp[],
  visit: (file: string) => void,
) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (ignore.some((rule) => rule.test(full))) continue;
    if (entry.isDirectory()) {
      if (["node_modules", ".next", "artifacts"].includes(entry.name)) continue;
      walk(full, extensions, ignore, visit);
    } else if (extensions.some((extension) => entry.name.endsWith(extension))) {
      visit(full);
    }
  }
}

export async function runGovernanceScript(
  definition: GovernanceScriptDefinition,
) {
  const args = parseGovernanceArgs(process.argv.slice(2));
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: args.dryRun,
    script: definition.name,
    summary: definition.summary,
    checks: definition.checks ?? [],
    disclaimers: GOVERNANCE_DISCLAIMERS,
    ...(definition.live ? await definition.live() : {}),
  };
  const file = writeGovernanceArtifact(definition.name, report);
  console.log(JSON.stringify(report, null, 2));
  console.log(`artifact: ${file}`);
}

export const catalogSummary = {
  count: CONSEQUENTIAL_SYSTEM_CATALOG.length,
  systemKeys: CONSEQUENTIAL_SYSTEM_CATALOG.map((item) => item.systemKey),
  highImpactCount: CONSEQUENTIAL_SYSTEM_CATALOG.filter((item) =>
    [
      "rights_affecting",
      "safety_relevant",
      "financial",
      "legally_significant",
    ].includes(item.actionRiskCeiling),
  ).length,
};
