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

export function writeText(subdir: string, filename: string, text: string) {
  const dir = ensureArtifactsDir(subdir);
  const file = path.join(dir, filename);
  fs.writeFileSync(file, text);
  return file;
}

export function ts(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

/**
 * When --dry-run is passed, scripts MUST NOT require a database. They should
 * produce a deterministic artifact stub explaining that dry-run mode was
 * used. This is the shared helper for that pattern.
 */
export function dryRunStubReport(input: {
  name: string;
  summary: string;
  extras?: Record<string, unknown>;
}) {
  return {
    generatedAt: new Date().toISOString(),
    dryRun: true,
    script: input.name,
    summary: input.summary,
    ...(input.extras ?? {}),
  };
}
