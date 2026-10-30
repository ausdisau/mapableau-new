#!/usr/bin/env node
/**
 * Fail-closed static-companion privacy and artifact boundary gate.
 * This does NOT prove regulatory registration, accessibility or source freshness.
 */
import { readFileSync, readdirSync, lstatSync, statSync } from "node:fs";
import { resolve, join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = resolve(ROOT, "src/generated/provider-directory.json");
const DIST = resolve(ROOT, "dist");
const EXPECTED_ROOT = new Set([
  "schema", "generatedAt", "source", "disclaimer", "inputRows",
  "excludedRows", "providerCount", "providers",
]);
const EXPECTED_PROVIDER = new Set([
  "id", "name", "state", "postcode", "suburb", "categories",
]);
const STATES = new Set(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]);

export function validatePublicIndex(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Provider index is not an object");
  }
  for (const key of Object.keys(payload)) {
    if (!EXPECTED_ROOT.has(key)) throw new Error("Unexpected public index field: " + key);
  }
  if (payload.schema !== "mapable.offline-provider-directory.v1") {
    throw new Error("Unknown offline provider index schema");
  }
  if (!Array.isArray(payload.providers) || !Number.isSafeInteger(payload.providerCount) ||
      payload.providerCount !== payload.providers.length) {
    throw new Error("Provider index count does not match its records");
  }
  if (!Number.isSafeInteger(payload.inputRows) || !Number.isSafeInteger(payload.excludedRows) ||
      payload.inputRows < payload.providerCount + payload.excludedRows) {
    throw new Error("Invalid provider index source accounting");
  }
  const identifiers = new Set();
  for (const row of payload.providers) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new Error("Invalid provider index row");
    }
    for (const key of Object.keys(row)) {
      if (!EXPECTED_PROVIDER.has(key)) throw new Error("Unexpected provider field: " + key);
    }
    if (typeof row.id !== "string" || !/^[a-f0-9]{18}$/.test(row.id) || identifiers.has(row.id)) {
      throw new Error("Missing or repeated provider identifier");
    }
    identifiers.add(row.id);
    if (typeof row.name !== "string" || !row.name.trim() || row.name.length > 160 ||
        /confidential/i.test(row.name) ||
        /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(row.name)) {
      throw new Error("Potentially private provider identifier in public index");
    }
    if (!STATES.has(row.state) || typeof row.postcode !== "string" ||
        !/^\d{4}$/.test(row.postcode) || typeof row.suburb !== "string" ||
        row.suburb.length > 60) {
      throw new Error("Invalid public provider location");
    }
    if (!Array.isArray(row.categories) || row.categories.length > 36 ||
        row.categories.some(x => typeof x !== "string" || x.length > 170)) {
      throw new Error("Invalid public support category");
    }
  }
  return { providers: payload.providers.length, sourceRows: payload.inputRows };
}

export function validateBuildTree(path) {
  const root = resolve(path);
  if (!statSync(join(root, "index.html")).isFile()) {
    throw new Error("Missing static index.html");
  }
  const banned = /(?:^|\/)(?:\.env(?:\..*)?|\.git|\.npmrc|package-lock\.json|provider-outlets\.json)(?:\/|$)|\.(?:map|pem|key|sqlite|db|log)$/i;
  let bytes = 0;
  let count = 0;
  function visit(folder) {
    for (const item of readdirSync(folder)) {
      const full = join(folder, item);
      const rel = relative(root, full).replaceAll("\\", "/");
      if (banned.test(rel)) throw new Error("Private/build-only file in static output: " + rel);
      const entry = lstatSync(full);
      if (entry.isSymbolicLink()) throw new Error("Symlink inside static output: " + rel);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile()) { bytes += entry.size; count++; }
      else throw new Error("Unexpected static build file: " + rel);
    }
  }
  visit(root);
  // A bounded preview should be usable on modest devices. Uncompressed size
  // alone does not prove runtime memory or page performance; test those separately.
  if (bytes > 25 * 1024 * 1024) throw new Error("Static release exceeds 25 MiB budget");
  return { files: count, bytes };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = validatePublicIndex(JSON.parse(readFileSync(DATA, "utf8")));
  const build = validateBuildTree(DIST);
  process.stdout.write("Static privacy and build boundary gate passed: " +
    JSON.stringify({ providers: index.providers, files: build.files, bytes: build.bytes }) + "\n");
}
