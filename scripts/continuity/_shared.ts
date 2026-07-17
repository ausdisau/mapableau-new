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

const STANDARD_DISCLAIMERS = [
  "Continuity preserves participant goals, not merely bookings.",
  "AURA cannot call 000 or dispatch emergency services.",
  "Stale or unvalidated signals cannot drive destructive action.",
  "Essential support is participant-defined, never inferred from diagnosis.",
];

export function dryRunStubReport(input: DryRunStubInput) {
  return {
    generatedAt: new Date().toISOString(),
    dryRun: true,
    script: input.name,
    summary: input.summary,
    disclaimers: STANDARD_DISCLAIMERS,
    ...(input.extras ?? {}),
  };
}

export async function runAudit(
  name: string,
  summary: string,
  extras: Record<string, unknown>,
  live?: () => Promise<Record<string, unknown>>
) {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun || !live) {
    const report = dryRunStubReport({ name, summary, extras });
    const file = writeArtifact("continuity", `${name}-${ts()}.json`, report);
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
    disclaimers: STANDARD_DISCLAIMERS,
    ...findings,
  };
  const file = writeArtifact("continuity", `${name}-${ts()}.json`, report);
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

/**
 * A source-level grep for a forbidden pattern in a set of file globs. Reads
 * files with fs; NEVER touches the DB. Suitable for dry-run.
 */
export function scanFilesForPattern(params: {
  roots: string[];
  extensions: string[];
  pattern: RegExp;
  ignore?: RegExp[];
}): Array<{ file: string; line: number; snippet: string }> {
  const hits: Array<{ file: string; line: number; snippet: string }> = [];
  const cwd = process.cwd();
  for (const root of params.roots) {
    walk(path.join(cwd, root), params.extensions, params.ignore ?? [], (file) => {
      const rel = path.relative(cwd, file);
      let content: string;
      try {
        content = fs.readFileSync(file, "utf8");
      } catch {
        return;
      }
      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        if (params.pattern.test(lines[i])) {
          hits.push({ file: rel, line: i + 1, snippet: lines[i].trim().slice(0, 240) });
        }
      }
    });
  }
  return hits;
}

function walk(
  dir: string,
  extensions: string[],
  ignore: RegExp[],
  visit: (file: string) => void
) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (ignore.some((r) => r.test(full))) continue;
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "artifacts") continue;
      walk(full, extensions, ignore, visit);
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      visit(full);
    }
  }
}
