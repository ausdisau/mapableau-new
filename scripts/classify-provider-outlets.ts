#!/usr/bin/env npx tsx
/**
 * Classify NDIS provider outlets against Provider Finder parameters.
 *
 * Reads from:
 *   --source=json   public/data/provider-outlets.json (default)
 *   --source=db     provider_outlets table via Prisma (requires DATABASE_URL)
 *
 * Usage:
 *   pnpm classify:provider-outlets
 *   pnpm classify:provider-outlets -- --limit 1000 --out data/provider-classifications.json
 *   pnpm classify:provider-outlets -- --source db --state NSW
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { REG_GROUP_OPTIONS } from "@/app/provider-finder/regGroupOptions";
import type { ProviderOutlet } from "@/data/provider-outlets.types";
import {
  classifyProviderOutlet,
  summarizeClassifications,
  type ClassifiedProviderOutlet,
} from "@/lib/provider-finder/classify-outlet";

const JSON_PATH = join(process.cwd(), "public", "data", "provider-outlets.json");

type OutletFile = { date?: string; data: ProviderOutlet[] };

type Args = {
  source: "json" | "db";
  limit: number | null;
  state: string | null;
  out: string | null;
  sample: number;
};

function parseArgs(argv: string[]): Args {
  let source: Args["source"] = "json";
  let limit: number | null = null;
  let state: string | null = null;
  let out: string | null = null;
  let sample = 5;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--source" && argv[i + 1]) {
      const value = argv[++i];
      if (value === "json" || value === "db") source = value;
    } else if (arg.startsWith("--source=")) {
      const value = arg.slice("--source=".length);
      if (value === "json" || value === "db") source = value;
    } else if (arg === "--limit" && argv[i + 1]) {
      limit = Number.parseInt(argv[++i], 10);
    } else if (arg.startsWith("--limit=")) {
      limit = Number.parseInt(arg.slice("--limit=".length), 10);
    } else if (arg === "--state" && argv[i + 1]) {
      state = argv[++i].toUpperCase();
    } else if (arg.startsWith("--state=")) {
      state = arg.slice("--state=".length).toUpperCase();
    } else if (arg === "--out" && argv[i + 1]) {
      out = resolve(argv[++i]);
    } else if (arg.startsWith("--out=")) {
      out = resolve(arg.slice("--out=".length));
    } else if (arg === "--sample" && argv[i + 1]) {
      sample = Number.parseInt(argv[++i], 10);
    } else if (arg.startsWith("--sample=")) {
      sample = Number.parseInt(arg.slice("--sample=".length), 10);
    }
  }

  return { source, limit, state, out, sample };
}

async function loadFromJson(): Promise<ProviderOutlet[]> {
  const raw = await readFile(JSON_PATH, "utf8");
  const parsed = JSON.parse(raw) as OutletFile;
  if (!Array.isArray(parsed.data)) {
    throw new Error("provider-outlets.json: expected { data: ProviderOutlet[] }");
  }
  return parsed.data;
}

async function loadFromDb(): Promise<ProviderOutlet[]> {
  const { prisma } = await import("@/lib/prisma");
  const rows = await prisma.providerOutletRegistry.findMany({
    select: {
      abn: true,
      name: true,
      outletName: true,
      flag: true,
      active: true,
      phone: true,
      website: true,
      email: true,
      address: true,
      headOffice: true,
      state: true,
      postcode: true,
      latitude: true,
      longitude: true,
      regGroup: true,
      openingHours: true,
      professions: true,
    },
  });

  return rows.map((row) => ({
    ABN: row.abn,
    Prov_N: row.name,
    Head_Office: row.headOffice ?? "",
    Outletname: row.outletName ?? row.name,
    Flag: (row.flag === "H" ? "H" : "O") as ProviderOutlet["Flag"],
    Active: row.active ? 1 : 0,
    Phone: row.phone ?? "",
    Website: row.website ?? "",
    Email: row.email ?? "",
    Address: row.address ?? "",
    State_cd: row.state as ProviderOutlet["State_cd"],
    Post_cd: Number.parseInt(row.postcode ?? "0", 10) || 0,
    Latitude: row.latitude ?? 0,
    Longitude: row.longitude ?? 0,
    RegGroup: row.regGroup,
    Post_cd_p: row.postcode ?? "",
    opnhrs: row.openingHours ?? "",
    prfsn: row.professions ?? "",
  }));
}

function printSummary(
  summary: ReturnType<typeof summarizeClassifications>,
  sourceLabel: string,
): void {
  console.log(`\nProvider Finder classification (${sourceLabel})`);
  console.log("=".repeat(56));
  console.log(`Total outlets:              ${summary.total}`);
  console.log(`Active (NDIS registered):   ${summary.activeCount}`);
  console.log(`Inactive (private):         ${summary.inactiveCount}`);
  console.log(`No RegGroup on outlet:    ${summary.noRegGroup}`);
  console.log(`No support type mapped:     ${summary.unclassifiedSupportType}`);
  console.log(`Multiple support types:     ${summary.multiSupportType}`);

  console.log("\nBy RegGroup (NDIS registration group, all indices):");
  const regGroupRows = REG_GROUP_OPTIONS.map((option) => ({
    index: option.Index,
    group: option.Group,
    name: option.RegGroup,
    count: summary.byRegGroup[option.RegGroup] ?? 0,
  })).sort((a, b) => b.count - a.count || a.index - b.index);
  for (const row of regGroupRows) {
    console.log(
      `  [${String(row.index).padStart(2)}] ${String(row.count).padStart(6)}  ${row.name}`,
    );
  }

  console.log("\nBy funding:");
  for (const [key, count] of Object.entries(summary.byFunding)) {
    console.log(`  ${key.padEnd(10)} ${count}`);
  }

  console.log("\nBy support type (Provider Finder chips):");
  for (const [key, count] of Object.entries(summary.bySupportType)) {
    console.log(`  ${key.padEnd(14)} ${count}`);
  }

  console.log("\nBy access need (keyword match):");
  for (const [key, count] of Object.entries(summary.byAccessNeed)) {
    if (count > 0) console.log(`  ${key.padEnd(14)} ${count}`);
  }

  console.log("\nBy state (top 10):");
  const topStates = Object.entries(summary.byState)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [key, count] of topStates) {
    console.log(`  ${key.padEnd(6)} ${count}`);
  }
}

function printSamples(rows: ClassifiedProviderOutlet[], sample: number): void {
  const picks = rows
    .filter((row) => row.regGroups.length > 0)
    .slice(0, sample);

  if (picks.length === 0) return;

  console.log(`\nSample classified outlets (${picks.length}):`);
  for (const row of picks) {
    const regGroupLabel = row.regGroups
      .map((rg) => `${rg.index}:${rg.regGroup}`)
      .join("; ");
    const supportLabel =
      row.supportTypes.length > 0 ? row.supportTypes.join(", ") : "(none)";
    console.log(
      `  - ${row.name} (${row.state} ${row.postcode})`,
    );
    console.log(`      RegGroup: ${regGroupLabel}`);
    console.log(
      `      support=${supportLabel} | funding=${row.funding}${
        row.accessNeedIds.length > 0 ? ` | access=${row.accessNeedIds.join(",")}` : ""
      }`,
    );
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  let outlets: ProviderOutlet[];
  if (args.source === "db") {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for --source=db");
    }
    outlets = await loadFromDb();
  } else {
    outlets = await loadFromJson();
  }

  if (args.state) {
    outlets = outlets.filter((o) => o.State_cd === args.state);
  }
  if (args.limit != null && args.limit > 0) {
    outlets = outlets.slice(0, args.limit);
  }

  const classified = outlets.map((outlet, index) =>
    classifyProviderOutlet(outlet, index),
  );
  const summary = summarizeClassifications(classified);

  printSummary(summary, args.source === "db" ? "provider_outlets table" : JSON_PATH);
  printSamples(classified, args.sample);

  if (args.out) {
    await mkdir(dirname(args.out), { recursive: true });
    await writeFile(
      args.out,
      JSON.stringify({ summary, rows: classified }, null, 2),
      "utf8",
    );
    console.log(`\nWrote classification report to ${args.out}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
