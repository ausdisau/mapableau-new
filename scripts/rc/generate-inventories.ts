import fs from "node:fs";
import path from "node:path";

import { getReleaseBlockers } from "../../lib/release-candidate/inventory/blocker-catalog";
import type { CountedPathSample } from "../../lib/release-candidate/inventory/types";

import {
  ARTIFACT_DIR,
  RC1_INVENTORY_DOCS_DIR,
  findMatches,
  getMigrationNames,
  getPrismaModelNames,
  isMainModule,
  listFiles,
  listFilesIn,
  parseEnvExampleKeys,
  printJson,
  readTextIfExists,
  relativePath,
  repoPath,
  toPosixPath,
  writeInventory,
} from "./_shared";

interface InventoryRunSummary {
  generatedAt: string;
  outputDirectories: string[];
  inventories: Array<{
    name: string;
    count: number;
  }>;
  recommendation: "reject" | "conditional-reject" | "pass";
}

const PLACEHOLDER_PATTERN = /\b(TODO|FIXME|placeholder|stub|demo)\b/gi;
const DEMO_PATTERN = /\b(demo|fixture|mock|sample|synthetic)\b/gi;
const PERMISSION_PATTERN = /"([a-z0-9:_-]+:[a-z0-9:_-]+)"/g;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numericField(payload: unknown, field: string): number | null {
  if (!isRecord(payload)) return null;
  const value = payload[field];
  return typeof value === "number" ? value : null;
}

function arrayFieldLength(payload: unknown, field: string): number | null {
  if (!isRecord(payload)) return null;
  const value = payload[field];
  return Array.isArray(value) ? value.length : null;
}

function aggregateTotalMatches(payload: unknown): number | null {
  if (!isRecord(payload)) return null;
  const aggregate = payload.aggregate;
  if (!isRecord(aggregate)) return null;
  const totalMatches = aggregate.totalMatches;
  return typeof totalMatches === "number" ? totalMatches : null;
}

function inventorySummaryCount(payload: unknown): number {
  const routeCount =
    (numericField(payload, "apiRouteCount") ?? 0) +
    (numericField(payload, "pageCount") ?? 0);
  return (
    numericField(payload, "prismaModelCount") ??
    (routeCount > 0 ? routeCount : null) ??
    numericField(payload, "migrationCount") ??
    numericField(payload, "permissionCount") ??
    aggregateTotalMatches(payload) ??
    numericField(payload, "demoFileCount") ??
    numericField(payload, "likelyUnusedCount") ??
    numericField(payload, "envKeyCount") ??
    arrayFieldLength(payload, "notes") ??
    arrayFieldLength(payload, "blockers") ??
    0
  );
}

function routeFromAppFile(filePath: string, marker: "page" | "route"): string {
  const rel = toPosixPath(relativePath(filePath));
  const withoutApp = rel.replace(/^app\//, "");
  const route = withoutApp
    .replace(new RegExp(`/${marker}\\.(ts|tsx|js|jsx)$`), "")
    .replace(/\(([^)]+)\)\//g, "")
    .replace(/\/+/g, "/");
  return (
    `/${route === marker || route.length === 0 ? "" : route}`.replace(
      /\/$/,
      "",
    ) || "/"
  );
}

function buildRouteInventory() {
  const apiRoutes = listFilesIn(["app/api"])
    .filter((filePath) =>
      /\/route\.(ts|tsx|js|jsx)$/.test(toPosixPath(filePath)),
    )
    .map((filePath) => ({
      path: relativePath(filePath),
      route: routeFromAppFile(filePath, "route"),
    }));

  const pages = listFilesIn(["app"])
    .filter((filePath) =>
      /\/page\.(ts|tsx|js|jsx)$/.test(toPosixPath(filePath)),
    )
    .map((filePath) => ({
      path: relativePath(filePath),
      route: routeFromAppFile(filePath, "page"),
    }));

  return {
    apiRouteCount: apiRoutes.length,
    pageCount: pages.length,
    apiRoutes,
    pages,
  };
}

function buildPermissionInventory() {
  const permissionsText = readTextIfExists(
    repoPath("lib", "auth", "permissions.ts"),
  );
  const permissions = Array.from(
    new Set(
      Array.from(
        permissionsText.matchAll(PERMISSION_PATTERN),
        (match) => match[1],
      ),
    ),
  ).sort();
  return {
    permissionCount: permissions.length,
    permissions,
    source: "lib/auth/permissions.ts",
  };
}

function summarizeMatches(matches: CountedPathSample[]) {
  return {
    fileCount: matches.length,
    totalMatches: matches.reduce((sum, match) => sum + match.count, 0),
    samplePaths: matches.slice(0, 25),
  };
}

function buildPlaceholderInventory() {
  const matches = findMatches(["lib", "app"], PLACEHOLDER_PATTERN);
  return {
    aggregate: summarizeMatches(matches),
    byTerm: ["TODO", "FIXME", "placeholder", "stub", "demo"].map((term) => {
      const termMatches = findMatches(
        ["lib", "app"],
        new RegExp(`\\b${term}\\b`, "gi"),
      );
      return {
        term,
        ...summarizeMatches(termMatches),
      };
    }),
  };
}

function buildDemoDataInventory() {
  const demoDirs = ["lib/demo", "fixtures", "tests/fixtures"].filter((relDir) =>
    fs.existsSync(repoPath(relDir)),
  );
  const demoFiles = demoDirs.flatMap((relDir) =>
    listFilesIn([relDir]).map(relativePath),
  );
  const hardCodedDemo = findMatches(["lib", "app"], DEMO_PATTERN);
  return {
    demoDirectories: demoDirs,
    demoFileCount: demoFiles.length,
    demoFiles: demoFiles.slice(0, 100),
    hardCodedDemoReferences: summarizeMatches(hardCodedDemo),
  };
}

function buildDuplicateServiceInventory() {
  const requestContextCandidates = listFiles()
    .filter((filePath) =>
      /request-context|tenant-context/i.test(path.basename(filePath)),
    )
    .map(relativePath);
  const authHandlerCandidates = listFilesIn(["app", "lib"])
    .filter((filePath) =>
      /auth|session|current-user/i.test(relativePath(filePath)),
    )
    .map(relativePath);

  return {
    notes: [
      {
        topic: "RequestContext / TenantContext candidates",
        authoritative: "lib/tenancy/context/*",
        duplicates: ["lib/multi-tenant-admin/tenant-context.ts"],
        action:
          "Use release-candidate context adapters to document boundaries before any rewrites.",
      },
      {
        topic: "Auth handlers",
        authoritative:
          "lib/auth/current-user.ts, lib/auth/guards.ts, lib/auth/permissions.ts",
        duplicates: [
          "Route-level auth checks under app/api remain candidates for consolidation.",
        ],
        action:
          "Do not bypass existing guards; inventory route handlers before consolidation.",
      },
    ],
    requestContextCandidatePaths: requestContextCandidates,
    authHandlerCandidateSamplePaths: authHandlerCandidates.slice(0, 75),
  };
}

function buildDeadCodeInventory() {
  const files = listFilesIn(["lib", "app", "scripts", "tests"]);
  const repoText = files
    .map((filePath) => readTextIfExists(filePath))
    .join("\n");
  const candidates = files.flatMap((filePath) => {
    const text = readTextIfExists(filePath);
    return Array.from(
      text.matchAll(
        /export\s+(?:async\s+)?(?:function|const|class|interface|type)\s+([A-Za-z0-9_]+)/g,
      ),
      (match) => ({
        symbol: match[1],
        path: relativePath(filePath),
        occurrenceCount:
          repoText.match(new RegExp(`\\b${match[1]}\\b`, "g"))?.length ?? 0,
      }),
    );
  });

  const likelyUnused = candidates
    .filter((candidate) => candidate.occurrenceCount <= 1)
    .sort(
      (a, b) =>
        a.path.localeCompare(b.path) || a.symbol.localeCompare(b.symbol),
    )
    .slice(0, 100);

  return {
    heuristic:
      "Exported symbols with one repository-wide textual occurrence; false positives expected.",
    scannedExportCount: candidates.length,
    likelyUnusedCount: likelyUnused.length,
    likelyUnused,
  };
}

export function generateInventories(): InventoryRunSummary {
  const modelNames = getPrismaModelNames();
  const migrationNames = getMigrationNames();
  const envKeys = parseEnvExampleKeys();
  const blockers = getReleaseBlockers();

  const documents = [
    writeInventory("domain-inventory", {
      prismaModelCount: modelNames.length,
      modelNames,
    }),
    writeInventory("route-inventory", buildRouteInventory()),
    writeInventory("migration-inventory", {
      migrationCount: migrationNames.length,
      migrationNames,
      note:
        migrationNames.length === 0
          ? "No migration folders are present under prisma/migrations; only migration_lock.toml was found if present."
          : "Migration folders were discovered under prisma/migrations.",
    }),
    writeInventory("permission-inventory", buildPermissionInventory()),
    writeInventory("placeholder-inventory", buildPlaceholderInventory()),
    writeInventory("demo-data-inventory", buildDemoDataInventory()),
    writeInventory(
      "duplicate-service-inventory",
      buildDuplicateServiceInventory(),
    ),
    writeInventory("dead-code-inventory", buildDeadCodeInventory()),
    writeInventory("environment-inventory", {
      envKeyCount: envKeys.length,
      envKeys,
      source: ".env.example",
    }),
    writeInventory("release-blockers", {
      recommendation: "reject",
      blockers,
    }),
  ];

  const summary: InventoryRunSummary = {
    generatedAt: new Date().toISOString(),
    outputDirectories: [
      relativePath(ARTIFACT_DIR),
      relativePath(RC1_INVENTORY_DOCS_DIR),
    ],
    inventories: documents.map((document) => {
      const payload = document.payload;
      return {
        name: document.metadata.name,
        count: inventorySummaryCount(payload),
      };
    }),
    recommendation: "reject",
  };

  writeInventory("release-blockers", {
    recommendation: summary.recommendation,
    blockers,
    inventorySummary: summary.inventories,
  });

  return summary;
}

if (isMainModule(import.meta.url)) {
  printJson(generateInventories());
}
