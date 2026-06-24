import { readFile } from "fs/promises";
import path from "path";

import type { AccessPlaceCategory } from "@prisma/client";

import { ACCREDITATION_CRITERIA } from "@/lib/access-accreditation/accreditation-criteria-service";
import {
  chunkArray,
  runWithConcurrency,
  SEED_BATCH_SIZE,
  SEED_CONCURRENCY,
  SEED_EXISTING_PLACE_THRESHOLD,
  SEED_MAX_IMPORT_ITEMS,
  SEED_PROGRESS_INTERVAL,
} from "@/lib/access-import/import-limits";
import { loadLegacyFileFromDataDir } from "@/lib/access-import/legacy-import-service";
import {
  fetchAllowlistedKmlForSeed,
  resolveKmlDocument,
} from "@/lib/access-import/kml-networklink-service";
import { sanitizeKmlDescription } from "@/lib/access-import/kml-parser-service";
import { mapPlacemarkToImportItem } from "@/lib/access-import/kml-to-access-place-mapper";
import {
  ACCESS_LEGACY_KML_ALT_FILENAME,
  ACCESS_LEGACY_KML_FILENAME,
  MAPABLE_MY_MAPS_KML_URL,
} from "@/lib/access-map/copy";
import { prisma } from "@/lib/prisma";

export interface BulkAccessSeedOptions {
  filePath?: string;
  publish?: boolean;
  force?: boolean;
  /** Parallel creates per batch (default SEED_CONCURRENCY ≈ 400 places/min). */
  concurrency?: number;
}

export interface BulkAccessSeedResult {
  skipped: boolean;
  reason?: string;
  parsed: number;
  created: number;
  conflicts: number;
  skippedItems: number;
  errors: number;
  elapsedMs?: number;
}

const SEED_ADMIN_EMAIL = "admin@mapable.test";

type SeedPlacemark = ReturnType<typeof mapPlacemarkToImportItem>;

type DedupIndex = {
  sourceRefs: Set<string>;
  namesLower: Set<string>;
};

export async function upsertAccessAccreditationCriteria() {
  for (const c of ACCREDITATION_CRITERIA) {
    await prisma.accessAccreditationCriterion.upsert({
      where: { code: c.code },
      create: {
        code: c.code,
        domain: c.domain,
        title: c.title,
        weight: c.weight,
        sortOrder: ACCREDITATION_CRITERIA.indexOf(c),
      },
      update: {
        domain: c.domain,
        title: c.title,
        weight: c.weight,
      },
    });
  }
}

export async function resolveSeedActorId(): Promise<string> {
  const admin = await prisma.user.findUnique({
    where: { email: SEED_ADMIN_EMAIL },
    select: { id: true },
  });
  if (!admin) {
    throw new Error(
      `Seed actor ${SEED_ADMIN_EMAIL} not found. Run npx prisma db seed first.`
    );
  }
  return admin.id;
}

async function readKmlFromFile(filePath: string): Promise<string> {
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);
  return readFile(resolved, "utf8");
}

async function loadKmlContent(filePath?: string): Promise<{ content: string; source: string }> {
  if (filePath) {
    return { content: await readKmlFromFile(filePath), source: filePath };
  }

  for (const fileName of [ACCESS_LEGACY_KML_FILENAME, ACCESS_LEGACY_KML_ALT_FILENAME]) {
    const local = await loadLegacyFileFromDataDir(fileName);
    if (local) {
      return { content: local, source: `data/imports/${fileName}` };
    }
  }

  const content = await fetchAllowlistedKmlForSeed(MAPABLE_MY_MAPS_KML_URL);
  return { content, source: MAPABLE_MY_MAPS_KML_URL };
}

async function loadDedupIndex(): Promise<DedupIndex> {
  const rows = await prisma.accessPlace.findMany({
    where: { status: { not: "archived" } },
    select: { sourceReference: true, name: true },
  });
  const sourceRefs = new Set<string>();
  const namesLower = new Set<string>();
  for (const row of rows) {
    if (row.sourceReference) sourceRefs.add(row.sourceReference);
    namesLower.add(row.name.toLowerCase());
  }
  return { sourceRefs, namesLower };
}

/** Reserve dedup keys synchronously before any await (safe under parallel workers). */
function tryReserveInIndex(item: SeedPlacemark, index: DedupIndex): boolean {
  if (item.latitude == null || item.longitude == null) return false;
  if (item.externalRef && index.sourceRefs.has(item.externalRef)) return false;
  const nameKey = item.name.toLowerCase();
  if (index.namesLower.has(nameKey)) return false;
  if (item.externalRef) index.sourceRefs.add(item.externalRef);
  index.namesLower.add(nameKey);
  return true;
}

async function processSeedPlacemark(
  item: SeedPlacemark,
  index: DedupIndex,
  actorId: string,
  publish: boolean
): Promise<"created" | "conflict" | "skipped" | "error"> {
  if (item.latitude == null || item.longitude == null) {
    return "skipped";
  }
  if (!tryReserveInIndex(item, index)) {
    return "conflict";
  }
  try {
    await fastCreateImportedPlace({ item, actorId, publish });
    return "created";
  } catch {
    return "error";
  }
}

async function fastCreateImportedPlace(params: {
  item: SeedPlacemark;
  actorId: string;
  publish: boolean;
}) {
  const { item, actorId, publish } = params;
  if (item.latitude == null || item.longitude == null) {
    throw new Error("MISSING_COORDS");
  }

  await prisma.accessPlace.create({
    data: {
      name: item.name,
      category: item.category as AccessPlaceCategory,
      description: item.description ?? undefined,
      country: "AU",
      status: publish ? "published" : "pending_moderation",
      sourceType: "imported",
      sourceReference: item.externalRef ?? undefined,
      confidence: publish ? "unknown" : "user_reported",
      createdById: actorId,
      location: {
        create: {
          latitude: item.latitude,
          longitude: item.longitude,
        },
      },
      sources: {
        create: {
          sourceType: "uploaded_kml",
          externalId: item.externalRef ?? undefined,
        },
      },
    },
  });
}

export async function bulkSeedAccessPlaces(
  options: BulkAccessSeedOptions = {}
): Promise<BulkAccessSeedResult> {
  const startedAt = Date.now();
  const concurrency = options.concurrency ?? SEED_CONCURRENCY;

  await upsertAccessAccreditationCriteria();

  const existingCount = await prisma.accessPlace.count();
  if (!options.force && existingCount >= SEED_EXISTING_PLACE_THRESHOLD) {
    return {
      skipped: true,
      reason: `${existingCount} places already exist (threshold ${SEED_EXISTING_PLACE_THRESHOLD}). Use --force to re-import.`,
      parsed: 0,
      created: 0,
      conflicts: 0,
      skippedItems: 0,
      errors: 0,
    };
  }

  const actorId = await resolveSeedActorId();
  const dedupIndex = await loadDedupIndex();

  const { content, source } = await loadKmlContent(options.filePath);
  const doc = await resolveKmlDocument(content);

  const placemarks = doc.placemarks.map((p) =>
    mapPlacemarkToImportItem({
      ...p,
      description: p.description ? sanitizeKmlDescription(p.description) : undefined,
    })
  );

  if (placemarks.length > SEED_MAX_IMPORT_ITEMS) {
    throw new Error(
      `Import exceeds seed maximum of ${SEED_MAX_IMPORT_ITEMS} features (${placemarks.length})`
    );
  }

  const job = await prisma.accessImportJob.create({
    data: {
      createdById: actorId,
      sourceType: options.filePath ? "uploaded_kml" : "kml_network_link",
      sourceUrl: options.filePath ? undefined : MAPABLE_MY_MAPS_KML_URL,
      fileName: options.filePath ? path.basename(options.filePath) : undefined,
      status: "committing",
      metadata: {
        seedSource: source,
        parsed: placemarks.length,
        concurrency,
        fastPath: true,
      },
    },
  });

  const publish = options.publish ?? false;
  const totals = { created: 0, conflicts: 0, skippedItems: 0, errors: 0, processed: 0 };

  console.log(
    `Importing ${placemarks.length} placemarks (${concurrency} parallel workers, fast path)…`
  );

  for (const batch of chunkArray(placemarks, SEED_BATCH_SIZE)) {
    const batchOutcomes: Array<"created" | "conflict" | "skipped" | "error"> = [];

    await runWithConcurrency(batch, concurrency, async (item) => {
      const outcome = await processSeedPlacemark(item, dedupIndex, actorId, publish);
      batchOutcomes.push(outcome);
    });

    for (const outcome of batchOutcomes) {
      totals.processed++;
      if (outcome === "created") totals.created++;
      else if (outcome === "conflict") totals.conflicts++;
      else if (outcome === "skipped") totals.skippedItems++;
      else totals.errors++;
    }

    if (
      totals.processed % SEED_PROGRESS_INTERVAL < batch.length ||
      totals.processed === placemarks.length
    ) {
      const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(0);
      const rate = ((totals.created / Math.max(1, Number(elapsedSec))) * 60).toFixed(0);
      console.log(
        `  … ${totals.processed}/${placemarks.length} processed · ${totals.created} created · ~${rate}/min · ${elapsedSec}s`
      );
    }
  }

  const { created, conflicts, skippedItems, errors } = totals;

  const elapsedMs = Date.now() - startedAt;

  await prisma.accessImportJob.update({
    where: { id: job.id },
    data: {
      status: "completed",
      metadata: {
        seedSource: source,
        parsed: placemarks.length,
        created,
        conflicts,
        skippedItems,
        errors,
        published: publish,
        concurrency,
        fastPath: true,
        elapsedMs,
      },
    },
  });

  return {
    skipped: false,
    parsed: placemarks.length,
    created,
    conflicts,
    skippedItems,
    errors,
    elapsedMs,
  };
}
