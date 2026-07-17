import fs from "node:fs";
import path from "node:path";

export interface ParticipationScriptDefinition {
  name: string;
  summary: string;
  category: "audit" | "backfill" | "test" | "evaluate";
}

export function parseParticipationArgs(argv: string[]) {
  return {
    dryRun: true,
    json: argv.includes("--json"),
  };
}

export function writeParticipationArtifact(
  name: string,
  payload: unknown,
): string {
  const dir = path.join(process.cwd(), "artifacts", "participation");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `${name}-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  return file;
}

export async function runParticipationScript(
  definition: ParticipationScriptDefinition,
): Promise<void> {
  const args = parseParticipationArgs(process.argv.slice(2));
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: args.dryRun,
    script: definition.name,
    category: definition.category,
    summary: definition.summary,
    counts: {
      plannedWrites: 0,
      recordsChanged: 0,
    },
    safeguards: [
      "No marketplace source is auto-published as an opportunity.",
      "Sponsored listings are reported separately, never ranked above organic results.",
      "Sensitive domains and reflections default private.",
      "Unknown or stale event access is not treated as accessible.",
      "NDIS funding eligibility is never inferred.",
    ],
  };
  const file = writeParticipationArtifact(definition.name, report);
  console.log(JSON.stringify(report, null, 2));
  console.log(`artifact: ${file}`);
}
