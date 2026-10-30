#!/usr/bin/env node
/**
 * Build an OFFLINE, organisation-level search index from the public NDIS
 * directory snapshot already bundled in this repo.
 *
 * Never publish confidential addresses, contact details, worker identities,
 * coordinates or credentials. An imported provider is NOT a current
 * registration or worker-screening verification.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(HERE, "../../../public/data/provider-outlets.json");
const GROUPS_SOURCE = resolve(HERE, "../../../app/provider-finder/regGroupOptions.ts");
const TARGET = resolve(HERE, "../src/generated/provider-directory.json");
const VALID_STATES = new Set(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"]);

function safeText(value, max = 160) {
  return typeof value === "string"
    ? value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
    : "";
}

export function parseGroups(source) {
  const groups = new Map();
  const regex = /Index:\s*(\d+),?\s*RegGroup:\s*"([^"]+)"/gm;
  for (const match of source.matchAll(regex)) groups.set(Number(match[1]), safeText(match[2], 170));
  if (groups.size < 20) throw new Error("Registration group mapping is incomplete");
  return groups;
}

export function makePublicDirectory(input, groupMap, generatedAt) {
  const records = Array.isArray(input) ? input : input?.providers;
  if (!Array.isArray(records)) throw new Error("Expected an array of NDIS provider outlets");
  const consolidated = new Map();
  let excluded = 0;
  for (const raw of records) {
    if (!raw || typeof raw !== "object" || Number(raw.Active) === 0) { excluded++; continue; }
    const name = safeText(raw.Prov_N || raw.Outletname);
    const state = safeText(raw.State_cd, 3).toUpperCase();
    const postcode = String(raw.Post_cd ?? "").padStart(4, "0");
    if (!name || !VALID_STATES.has(state) || !/^\d{4}$/.test(postcode)) { excluded++; continue; }

    const office = safeText(raw.Head_Office, 90);
    const place = office.match(/^(.+?)\s+(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\s+\d{4}$/i);
    const suburb = place && place[2].toUpperCase() === state ? safeText(place[1], 60) : "";
    const key = [name.toLowerCase(), state, postcode].join("|");
    const groups = Array.isArray(raw.RegGroup) ? raw.RegGroup.map(Number).filter(n => groupMap.has(n)) : [];
    let existing = consolidated.get(key);
    if (!existing) {
      existing = {
        id: createHash("sha256").update(key).digest("hex").slice(0, 18),
        name, state, postcode, suburb, categories: [],
      };
      consolidated.set(key, existing);
    }
    if (!existing.suburb && suburb) existing.suburb = suburb;
    const categories = new Set(existing.categories);
    for (const group of groups) categories.add(groupMap.get(group));
    existing.categories = Array.from(categories).sort((a, b) => a.localeCompare(b, "en-AU"));
  }
  const providers = Array.from(consolidated.values()).sort((a, b) =>
    a.state.localeCompare(b.state, "en-AU") ||
    a.postcode.localeCompare(b.postcode, "en-AU") ||
    a.name.localeCompare(b.name, "en-AU"),
  );
  return {
    schema: "mapable.offline-provider-directory.v1",
    generatedAt,
    source: "public/data/provider-outlets.json, bundled NDIS Provider Finder snapshot",
    disclaimer: "Snapshot only; no live NDIS registration, screening, accessibility, availability or service-area verification.",
    inputRows: records.length,
    excludedRows: excluded,
    providerCount: providers.length,
    providers,
  };
}

export function buildDirectory({ source = SOURCE, groups = GROUPS_SOURCE, target = TARGET, now = new Date() } = {}) {
  const raw = JSON.parse(readFileSync(source, "utf8"));
  const groupsByIndex = parseGroups(readFileSync(groups, "utf8"));
  const result = makePublicDirectory(raw, groupsByIndex, now.toISOString());
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(result) + "\n", "utf8");
  return { target, providerCount: result.providerCount, excludedRows: result.excludedRows };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = buildDirectory();
  process.stdout.write("Created offline provider directory: " + JSON.stringify(result) + "\n");
}
