import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, extname } from "node:path";
import { pathToFileURL } from "node:url";

const LEFT_MARKER = "<".repeat(7);
const BASE_MARKER = "|".repeat(7);
const SEPARATOR = "=".repeat(7);
const RIGHT_MARKER = ">".repeat(7);
const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".graphql",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".prisma",
  ".py",
  ".sh",
  ".sql",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yaml",
  ".yml",
]);
const TEXT_FILENAMES = new Set([
  ".env",
  ".env.example",
  ".gitignore",
  ".prettierignore",
  ".replit",
  "Dockerfile",
  "Makefile",
]);

export interface ConflictLocation {
  line: number;
  reason: "content-differs" | "malformed";
}

export interface RectifyResult {
  text: string;
  resolved: number;
  unresolved: ConflictLocation[];
}

function splitLinesWithEndings(text: string): string[] {
  return text.match(/[^\n]*(?:\n|$)/g)?.filter(Boolean) ?? [];
}

function isMarker(line: string, marker: string): boolean {
  return line.startsWith(marker);
}

/**
 * Resolve only conflict hunks whose two sides are byte-for-byte identical
 * after line-ending normalisation. Any semantic choice remains unresolved and
 * must be reviewed by a person.
 */
export function rectifyConflictText(text: string): RectifyResult {
  const lines = splitLinesWithEndings(text);
  const output: string[] = [];
  const unresolved: ConflictLocation[] = [];
  let resolved = 0;

  for (let index = 0; index < lines.length; index += 1) {
    if (!isMarker(lines[index], LEFT_MARKER)) {
      output.push(lines[index]);
      continue;
    }

    const start = index;
    let base = -1;
    let separator = -1;
    let end = -1;
    for (let cursor = start + 1; cursor < lines.length; cursor += 1) {
      if (
        base === -1 &&
        separator === -1 &&
        isMarker(lines[cursor], BASE_MARKER)
      ) {
        base = cursor;
      } else if (separator === -1 && isMarker(lines[cursor], SEPARATOR)) {
        separator = cursor;
      } else if (separator !== -1 && isMarker(lines[cursor], RIGHT_MARKER)) {
        end = cursor;
        break;
      }
    }

    if (separator === -1 || end === -1) {
      unresolved.push({ line: start + 1, reason: "malformed" });
      output.push(...lines.slice(start));
      break;
    }

    const oursEnd = base === -1 ? separator : base;
    const ours = lines.slice(start + 1, oursEnd).join("");
    const theirs = lines.slice(separator + 1, end).join("");
    if (ours.replaceAll("\r\n", "\n") === theirs.replaceAll("\r\n", "\n")) {
      output.push(ours);
      resolved += 1;
    } else {
      unresolved.push({ line: start + 1, reason: "content-differs" });
      output.push(...lines.slice(start, end + 1));
    }
    index = end;
  }

  return { text: output.join(""), resolved, unresolved };
}

function repositoryFiles(): string[] {
  const result = spawnSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || "Unable to list repository files");
  }
  return result.stdout.split("\0").filter(Boolean);
}

function shouldScan(path: string): boolean {
  return (
    TEXT_EXTENSIONS.has(extname(path).toLowerCase()) ||
    TEXT_FILENAMES.has(basename(path))
  );
}

export function rectifyRepository(mode: "check" | "fix"): number {
  let markerFiles = 0;
  let safeResolutions = 0;
  let unsafeConflicts = 0;

  for (const path of repositoryFiles()) {
    if (!shouldScan(path)) continue;
    const bytes = readFileSync(path);
    if (bytes.includes(0)) continue;
    const original = bytes.toString("utf8");
    if (!original.includes(LEFT_MARKER)) continue;

    const result = rectifyConflictText(original);
    if (result.resolved === 0 && result.unresolved.length === 0) continue;
    markerFiles += 1;
    safeResolutions += result.resolved;
    unsafeConflicts += result.unresolved.length;

    if (mode === "fix" && result.resolved > 0) {
      writeFileSync(path, result.text, "utf8");
    }
    for (const conflict of result.unresolved) {
      console.error(
        `${path}:${conflict.line}: unresolved merge conflict (${conflict.reason})`,
      );
    }
  }

  if (mode === "check" && markerFiles > 0) {
    console.error(
      `Conflict rectifier found markers in ${markerFiles} file(s); run "pnpm rectify:conflicts".`,
    );
    return 1;
  }
  if (mode === "fix" && safeResolutions > 0) {
    console.log(
      `Conflict rectifier safely resolved ${safeResolutions} duplicate hunk(s).`,
    );
  }
  if (unsafeConflicts > 0) {
    console.error(
      `${unsafeConflicts} semantic conflict(s) require review; no side was chosen automatically.`,
    );
    return 1;
  }

  console.log("Conflict rectifier: no unresolved markers.");
  return 0;
}

function main(): void {
  const mode = process.argv.includes("--fix") ? "fix" : "check";
  process.exitCode = rectifyRepository(mode);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
