import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  InventoryDocument,
  InventoryName,
} from "../../lib/release-candidate/inventory/types";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };
export type JsonRecord = { [key: string]: JsonValue };

export const ROOT_DIR = process.cwd();
export const ARTIFACT_DIR = path.join(
  ROOT_DIR,
  "artifacts",
  "release-candidate",
);
export const RC1_DOCS_DIR = path.join(ROOT_DIR, "docs", "releases", "rc1");
export const RC1_INVENTORY_DOCS_DIR = path.join(RC1_DOCS_DIR, "inventories");
export const RC1_MANIFEST_DOCS_DIR = path.join(RC1_DOCS_DIR, "manifests");

const IGNORED_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  "artifacts",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "tmp",
]);

const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".env",
  ".example",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".prisma",
  ".sh",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

export function repoPath(...segments: string[]): string {
  return path.join(ROOT_DIR, ...segments);
}

export function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export function relativePath(filePath: string): string {
  return toPosixPath(path.relative(ROOT_DIR, filePath));
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function readTextIfExists(filePath: string): string {
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf8");
}

export function readJsonFile(filePath: string): JsonRecord {
  const parsed: unknown = JSON.parse(readTextIfExists(filePath));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Expected JSON object at ${relativePath(filePath)}`);
  }
  return parsed as JsonRecord;
}

function shouldReadFile(filePath: string): boolean {
  const basename = path.basename(filePath);
  if (basename === ".env.example") return true;
  return TEXT_EXTENSIONS.has(path.extname(filePath));
}

export function listFiles(startDir = ROOT_DIR): string[] {
  if (!fs.existsSync(startDir)) return [];
  const files: string[] = [];
  const entries = fs.readdirSync(startDir, { withFileTypes: true });

  for (const entry of entries) {
    const absolute = path.join(startDir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        files.push(...listFiles(absolute));
      }
      continue;
    }

    if (entry.isFile() && shouldReadFile(absolute)) {
      files.push(absolute);
    }
  }

  return files.sort((a, b) => relativePath(a).localeCompare(relativePath(b)));
}

export function listFilesIn(relDirs: string[]): string[] {
  return relDirs.flatMap((relDir) => listFiles(repoPath(relDir)));
}

export function findMatches(
  relDirs: string[],
  expression: RegExp,
): Array<{ path: string; count: number }> {
  return listFilesIn(relDirs)
    .map((filePath) => {
      const text = readTextIfExists(filePath);
      const matches = text.match(expression);
      return {
        path: relativePath(filePath),
        count: matches?.length ?? 0,
      };
    })
    .filter((result) => result.count > 0)
    .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path));
}

export function makeInventory<TPayload>(
  name: InventoryName,
  payload: TPayload,
): InventoryDocument<TPayload> {
  return {
    metadata: {
      name,
      generatedAt: new Date().toISOString(),
      source: "repository-static-scan",
    },
    payload,
  };
}

export function writeJson(filePath: string, payload: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

export function writeInventory<TPayload>(
  name: InventoryName,
  payload: TPayload,
): InventoryDocument<TPayload> {
  const document = makeInventory(name, payload);
  writeJson(path.join(ARTIFACT_DIR, `${name}.json`), document);
  writeJson(path.join(RC1_INVENTORY_DOCS_DIR, `${name}.json`), document);
  return document;
}

export function getPrismaModelNames(): string[] {
  const schema = readTextIfExists(repoPath("prisma", "schema.prisma"));
  return Array.from(
    schema.matchAll(/^model\s+([A-Za-z0-9_]+)\s+\{/gm),
    (match) => match[1],
  ).sort();
}

export function getMigrationNames(): string[] {
  const migrationsDir = repoPath("prisma", "migrations");
  if (!fs.existsSync(migrationsDir)) return [];
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function parseEnvExampleKeys(): string[] {
  const env = readTextIfExists(repoPath(".env.example"));
  return env
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => line.match(/^([A-Z0-9_]+)=/)?.[1])
    .filter((key): key is string => Boolean(key))
    .sort();
}

export function isMainModule(importMetaUrl: string): boolean {
  return process.argv[1] === fileURLToPath(importMetaUrl);
}

export function printJson(payload: unknown): void {
  console.log(JSON.stringify(payload, null, 2));
}

export interface RcScriptArgs {
  dryRun: boolean;
  json: boolean;
}

export interface RcAuditDefinition {
  name: string;
  summary: string;
  category: "audit" | "backfill" | "verify" | "evaluate";
  collect: (args: RcScriptArgs) => unknown;
}

export function parseRcArgs(argv = process.argv.slice(2)): RcScriptArgs {
  return {
    dryRun: argv.includes("--dry-run") || argv.includes("-n"),
    json: argv.includes("--json"),
  };
}

export function writeRcArtifact(name: string, payload: unknown): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(ARTIFACT_DIR, `${name}-${stamp}.json`);
  writeJson(filePath, payload);
  return filePath;
}

export function runRcAudit(definition: RcAuditDefinition): void {
  const args = parseRcArgs();
  const report = {
    generatedAt: new Date().toISOString(),
    script: definition.name,
    category: definition.category,
    dryRun: args.dryRun,
    summary: definition.summary,
    result: definition.collect(args),
  };
  const artifact = writeRcArtifact(definition.name, report);
  printJson({ ...report, artifact: relativePath(artifact) });
}
