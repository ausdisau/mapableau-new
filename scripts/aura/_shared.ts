import fs from "node:fs";
import path from "node:path";

export function parseArgs(argv: string[]) {
  return {
    dryRun: argv.includes("--dry-run") || argv.includes("-n"),
    verbose: argv.includes("--verbose") || argv.includes("-v"),
    json: argv.includes("--json"),
  };
}

export function ensureArtifactsDir(subdir: string): string {
  const dir = path.join(process.cwd(), "artifacts", subdir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function writeArtifact(subdir: string, filename: string, payload: unknown) {
  const dir = ensureArtifactsDir(subdir);
  const file = path.join(dir, filename);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  return file;
}

export function ts(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export interface DryRunStubInput {
  name: string;
  summary: string;
  extras?: Record<string, unknown>;
}

export function dryRunStubReport(input: DryRunStubInput) {
  return {
    generatedAt: new Date().toISOString(),
    dryRun: true,
    script: input.name,
    summary: input.summary,
    disclaimer:
      "AURA is not sentient, not a legal representative, not medical, and not a financial adviser.",
    ...(input.extras ?? {}),
  };
}

/**
 * Standard runner: if `--dry-run`, produce a deterministic artifact stub with
 * no DB or network calls. Otherwise run the live handler.
 */
export async function runAudit(
  name: string,
  summary: string,
  extras: Record<string, unknown>,
  live?: () => Promise<Record<string, unknown>>
) {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun || !live) {
    const report = dryRunStubReport({ name, summary, extras });
    const file = writeArtifact("aura", `${name}-${ts()}.json`, report);
    console.log(JSON.stringify(report, null, 2));
    console.log(`report: ${file}`);
    return;
  }
  const findings = await live();
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: false,
    script: name,
    summary,
    ...findings,
  };
  const file = writeArtifact("aura", `${name}-${ts()}.json`, report);
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}
