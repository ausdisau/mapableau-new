import fs from "node:fs";
import path from "node:path";

export interface AccessOpsScriptDefinition {
  name: string;
  summary: string;
  category: "audit" | "backfill" | "test" | "conformance" | "evaluate";
  live?: () => Promise<Record<string, unknown>>;
}

export function parseAccessOpsArgs(argv: string[]) {
  return {
    dryRun: argv.includes("--dry-run") || argv.includes("-n"),
    json: argv.includes("--json"),
  };
}

export function writeAccessOpsArtifact(name: string, payload: unknown): string {
  const dir = path.join(process.cwd(), "artifacts", "accessops");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `${name}-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  return file;
}

export async function runAccessOpsScript(
  definition: AccessOpsScriptDefinition,
): Promise<void> {
  const args = parseAccessOpsArgs(process.argv.slice(2));
  const base = {
    generatedAt: new Date().toISOString(),
    dryRun: args.dryRun,
    script: definition.name,
    category: definition.category,
    summary: definition.summary,
    counts: {
      plannedWrites: args.dryRun ? 0 : null,
      recordsChanged: args.dryRun ? 0 : null,
    },
    safeIdentifiers: [] as string[],
    disclaimers: [
      "Accreditation is not live operational status.",
      "Missing data is not treated as accessible.",
      "Stale data is not treated as current.",
      "AccessOps performs no infrastructure actuation.",
      "Routes are advisory and retain uncertainty.",
    ],
  };
  const live = !args.dryRun && definition.live ? await definition.live() : {};
  const report = { ...base, ...live };
  const file = writeAccessOpsArtifact(definition.name, report);
  console.log(JSON.stringify(report, null, 2));
  console.log(`artifact: ${file}`);
}
