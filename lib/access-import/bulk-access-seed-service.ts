import { readFile } from "fs/promises";
import path from "path";

import { ACCREDITATION_CRITERIA } from "@/lib/access-accreditation/accreditation-criteria-service";
import { findDuplicatePlaceCandidates } from "@/lib/access-import/import-deduplication-service";
import {
  chunkArray,
  SEED_BATCH_SIZE,
  SEED_EXISTING_PLACE_THRESHOLD,
  SEED_MAX_IMPORT_ITEMS,
} from "@/lib/access-import/import-limits";
import { loadLegacyFileFromDataDir } from "@/lib/access-import/legacy-import-service";
import {
  fetchAllowlistedKmlForSeed,
  resolveKmlDocument,
} from "@/lib/access-import/kml-networklink-service";
import { sanitizeKmlDescription } from "@/lib/access-import/kml-parser-service";
import { mapPlacemarkToImportItem } from "@/lib/access-import/kml-to-access-place-mapper";
import {
  createAccessPlace,
  publishAccessPlace,
} from "@/lib/access-map/access-place-service";
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
}

export interface BulkAccessSeedResult {
  skipped: boolean;
  reason?: string;
  parsed: number;
  created: number;
  conflicts: number;
  skippedItems: number;
  errors: number;
}

const SEED_ADMIN_EMAIL = "admin@mapable.test";

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

export async function bulkSeedAccessPlaces(
  options: BulkAccessSeedOptions = {}
): Promise<BulkAccessSeedResult> {
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
      metadata: { seedSource: source, parsed: placemarks.length },
    },
  });

  let created = 0;
  let conflicts = 0;
  let skippedItems = 0;
  let errors = 0;

  for (const batch of chunkArray(placemarks, SEED_BATCH_SIZE)) {
    for (const item of batch) {
      if (item.latitude == null || item.longitude == null) {
        skippedItems++;
        continue;
      }

      try {
        const dupes = await findDuplicatePlaceCandidates({
          name: item.name,
          latitude: item.latitude,
          longitude: item.longitude,
          sourceReference: item.externalRef,
        });

        if (dupes.length > 0) {
          conflicts++;
          continue;
        }

        const place = await createAccessPlace({
          input: {
            name: item.name,
            category: item.category,
            description: item.description ?? undefined,
            latitude: item.latitude,
            longitude: item.longitude,
            country: "AU",
          },
          createdById: actorId,
          status: "pending_moderation",
          sourceType: "imported",
          sourceReference: item.externalRef ?? undefined,
        });

        await prisma.accessPlaceSource.create({
          data: {
            placeId: place.id,
            sourceType: "uploaded_kml",
            externalId: item.externalRef ?? undefined,
          },
        });

        if (options.publish) {
          await publishAccessPlace(place.id, actorId);
        }

        created++;
      } catch {
        errors++;
      }
    }
  }

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
        published: options.publish ?? false,
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
  };
}
