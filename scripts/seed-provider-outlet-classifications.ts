#!/usr/bin/env npx tsx
/**
 * Seed Provider Finder classifications onto all provider_outlets rows.
 *
 * Backfills support_types and access_need_ids from RegGroup + keyword rules.
 * Safe to re-run; overwrites classification columns only.
 *
 * Prerequisites:
 *   pnpm prisma migrate deploy
 *   DATABASE_URL set
 *
 * Usage:
 *   pnpm seed:provider-outlet-classifications
 *   pnpm seed:provider-outlet-classifications -- --limit 1000
 *   pnpm seed:provider-outlet-classifications -- --source json
 */
import { PrismaClient } from "@prisma/client";

import type { ProviderOutlet } from "@/data/provider-outlets.types";
import {
  classificationFieldsFromOutlet,
  providerOutletFromRaw,
  summarizeClassifications,
  classifyProviderOutlet,
} from "@/lib/provider-finder/classify-outlet";
import { loadNdisListProviders } from "@/lib/ndis/list-providers-source";
import { mapProviderOutletToPrisma } from "@/lib/ndis/map-provider-outlet-prisma";

const prisma = new PrismaClient();
const DEFAULT_BATCH = 500;

type Source = "db" | "json";

function parseArgs(argv: string[]): {
  limit: number | null;
  batch: number;
  source: Source;
  file: string | undefined;
} {
  let limit: number | null = null;
  let batch = DEFAULT_BATCH;
  let source: Source = "db";
  let file: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--limit" && argv[i + 1]) {
      limit = Number.parseInt(argv[++i], 10);
    } else if (arg.startsWith("--limit=")) {
      limit = Number.parseInt(arg.slice("--limit=".length), 10);
    } else if (arg === "--batch" && argv[i + 1]) {
      batch = Math.min(Math.max(Number.parseInt(argv[++i], 10), 1), 1000);
    } else if (arg.startsWith("--batch=")) {
      batch = Math.min(
        Math.max(Number.parseInt(arg.slice("--batch=".length), 10), 1),
        1000,
      );
    } else if (arg === "--source" && argv[i + 1]) {
      const value = argv[++i];
      if (value === "db" || value === "json") source = value;
    } else if (arg.startsWith("--source=")) {
      const value = arg.slice("--source=".length);
      if (value === "db" || value === "json") source = value;
    } else if (arg === "--file" && argv[i + 1]) {
      file = argv[++i];
    } else if (arg.startsWith("--file=")) {
      file = arg.slice("--file=".length);
    }
  }

  return { limit, batch, source, file };
}

function outletFromRegistryRow(row: {
  abn: string;
  name: string;
  outletName: string | null;
  flag: string | null;
  active: boolean;
  phone: string | null;
  website: string | null;
  email: string | null;
  address: string | null;
  headOffice: string | null;
  state: string;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  regGroup: number[];
  openingHours: string | null;
  professions: string | null;
  raw: unknown;
}): ProviderOutlet | null {
  const fromRaw = providerOutletFromRaw(row.raw);
  if (fromRaw) return fromRaw;

  return providerOutletFromRaw(null, {
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
  });
}

async function seedFromJson(
  limit: number | null,
  batch: number,
  file: string | undefined,
): Promise<void> {
  const { date, data } = await loadNdisListProviders(file);
  const slice = limit != null && limit > 0 ? data.slice(0, limit) : data;

  console.log(
    `Seeding classifications for ${slice.length} outlets from JSON${date ? ` (export date: ${date})` : ""}.`,
  );

  let upserted = 0;
  const classified = slice.map((outlet, index) =>
    classifyProviderOutlet(outlet, index),
  );
  const summary = summarizeClassifications(classified);
  printSummary(summary);

  for (let offset = 0; offset < slice.length; offset += batch) {
    const chunk = slice.slice(offset, offset + batch);
    await prisma.$transaction(
      chunk.map((outlet, i) => {
        const row = mapProviderOutletToPrisma(outlet, offset + i);
        return prisma.providerOutletRegistry.upsert({
          where: { id: row.id },
          create: { ...row, sourceDate: date ?? null },
          update: {
            supportTypes: row.supportTypes,
            accessNeedIds: row.accessNeedIds,
            sourceDate: date ?? null,
          },
        });
      }),
    );
    upserted += chunk.length;
    if (upserted % 5000 === 0 || upserted === slice.length) {
      console.log(`Classified ${upserted}/${slice.length}`);
    }
  }
}

async function seedFromDb(limit: number | null, batch: number): Promise<void> {
  const total = await prisma.providerOutletRegistry.count();
  const target = limit != null && limit > 0 ? Math.min(limit, total) : total;

  console.log(`Backfilling classifications for ${target}/${total} provider_outlets rows.`);

  let processed = 0;
  let skipped = 0;
  const summaryRows: ReturnType<typeof classifyProviderOutlet>[] = [];
  let cursor: string | undefined;

  while (processed < target) {
    const take = Math.min(batch, target - processed);
    const rows = await prisma.providerOutletRegistry.findMany({
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: {
        id: true,
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
        raw: true,
      },
    });

    if (rows.length === 0) break;

    await prisma.$transaction(
      rows.map((row) => {
        const outlet = outletFromRegistryRow(row);
        if (!outlet) {
          skipped += 1;
          return prisma.providerOutletRegistry.update({
            where: { id: row.id },
            data: { supportTypes: [], accessNeedIds: [] },
          });
        }

        const fields = classificationFieldsFromOutlet(outlet);
        summaryRows.push(classifyProviderOutlet(outlet, processed));

        return prisma.providerOutletRegistry.update({
          where: { id: row.id },
          data: {
            supportTypes: fields.supportTypes,
            accessNeedIds: fields.accessNeedIds,
          },
        });
      }),
    );

    processed += rows.length;
    cursor = rows[rows.length - 1]?.id;

    if (processed % 5000 === 0 || processed >= target) {
      console.log(`Classified ${processed}/${target}`);
    }
  }

  const summary = summarizeClassifications(summaryRows);
  printSummary(summary);

  if (skipped > 0) {
    console.log(`Skipped ${skipped} rows with unparseable outlet data.`);
  }
}

function printSummary(summary: ReturnType<typeof summarizeClassifications>): void {
  console.log("\nClassification summary");
  console.log(`  total:                 ${summary.total}`);
  console.log(`  active (NDIS):         ${summary.activeCount}`);
  console.log(`  no support type:       ${summary.unclassifiedSupportType}`);
  console.log(`  multiple support type: ${summary.multiSupportType}`);
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed provider classifications.");
  }

  const { limit, batch, source, file } = parseArgs(process.argv.slice(2));

  if (source === "json") {
    await seedFromJson(limit, batch, file);
  } else {
    await seedFromDb(limit, batch);
  }

  const classifiedCount = await prisma.providerOutletRegistry.count({
    where: {
      OR: [
        { supportTypes: { isEmpty: false } },
        { accessNeedIds: { isEmpty: false } },
      ],
    },
  });
  const tableTotal = await prisma.providerOutletRegistry.count();
  console.log(`\nDone. classified_rows=${classifiedCount} table_total=${tableTotal}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
