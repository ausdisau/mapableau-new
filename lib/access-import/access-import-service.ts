import { readFile } from "fs/promises";
import path from "path";

import type { AccessImportSourceType } from "@prisma/client";

import {
  ACCESS_IMPORT_DATA_DIR,
  ACCESS_LEGACY_GEOJSON_FILENAME,
  ACCESS_LEGACY_KML_FILENAME,
} from "@/lib/access-map/copy";
import { createAccessPlace } from "@/lib/access-map/access-place-service";
import { parseAccessibleLocationsGeoJson } from "@/lib/access-import/geojson-parser-service";
import { findDuplicatePlaceCandidates } from "@/lib/access-import/import-deduplication-service";
import { mapPlacemarkToImportItem } from "@/lib/access-import/kml-to-access-place-mapper";
import { parseKmlXml, sanitizeKmlDescription } from "@/lib/access-import/kml-parser-service";
import { resolveKmlDocument } from "@/lib/access-import/kml-networklink-service";
import { prisma } from "@/lib/prisma";

export async function createImportJob(params: {
  createdById: string;
  sourceType: AccessImportSourceType;
  sourceUrl?: string;
  fileName?: string;
}) {
  return prisma.accessImportJob.create({
    data: {
      createdById: params.createdById,
      sourceType: params.sourceType,
      sourceUrl: params.sourceUrl,
      fileName: params.fileName,
      status: "pending",
    },
  });
}

export async function parseImportJobContent(
  jobId: string,
  content: string,
  sourceType: AccessImportSourceType
) {
  await prisma.accessImportJob.update({
    where: { id: jobId },
    data: { status: "parsing" },
  });

  let placemarks: ReturnType<typeof mapPlacemarkToImportItem>[] = [];
  const errors: string[] = [];

  if (sourceType === "geojson_upload") {
    const parsed = parseAccessibleLocationsGeoJson(content);
    errors.push(...parsed.errors);
    placemarks = parsed.placemarks.map(mapPlacemarkToImportItem);
  } else {
    const doc = await resolveKmlDocument(content);
    if (doc.networkLinkHref && !doc.placemarks.length) {
      await prisma.accessImportSource.create({
        data: { jobId, url: doc.networkLinkHref, rawMeta: { type: "network_link" } },
      });
    }
    placemarks = doc.placemarks.map((p) =>
      mapPlacemarkToImportItem({
        ...p,
        description: p.description ? sanitizeKmlDescription(p.description) : undefined,
      })
    );
  }

  await prisma.accessImportItem.deleteMany({ where: { jobId } });

  for (const item of placemarks) {
    const conflicts = await findDuplicatePlaceCandidates({
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      sourceReference: item.externalRef,
    });

    const importItem = await prisma.accessImportItem.create({
      data: {
        jobId,
        name: item.name,
        description: item.description,
        latitude: item.latitude,
        longitude: item.longitude,
        category: item.category,
        externalRef: item.externalRef,
        rawData: item.rawData,
        status: conflicts.length ? "conflict" : "pending",
      },
    });

    for (const c of conflicts) {
      await prisma.accessImportConflict.create({
        data: {
          jobId,
          importItemId: importItem.id,
          existingPlaceId: c.placeId,
          resolution: c.reason,
        },
      });
    }
  }

  await prisma.accessImportJob.update({
    where: { id: jobId },
    data: { status: "preview_ready", metadata: { parsed: placemarks.length, errors } },
  });

  return { count: placemarks.length, errors };
}

export async function commitImportJob(jobId: string, actorId: string) {
  const items = await prisma.accessImportItem.findMany({
    where: { jobId, status: { in: ["pending", "accepted"] } },
  });

  let created = 0;
  for (const item of items) {
    if (item.latitude == null || item.longitude == null) {
      await prisma.accessImportItem.update({
        where: { id: item.id },
        data: { status: "skipped" },
      });
      continue;
    }

    const place = await createAccessPlace({
      input: {
        name: item.name,
        category: (item.category as never) ?? "other",
        description: item.description ?? undefined,
        latitude: item.latitude,
        longitude: item.longitude,
        country: "AU",
      },
      createdById: actorId,
      status: "pending_moderation",
      sourceType: "imported",
      sourceReference: item.externalRef ?? item.id,
    });

    await prisma.accessPlaceSource.create({
      data: {
        placeId: place.id,
        sourceType: "uploaded_kml",
        externalId: item.externalRef ?? undefined,
      },
    });

    await prisma.accessImportItem.update({
      where: { id: item.id },
      data: { status: "accepted", matchedPlaceId: place.id },
    });
    created++;
  }

  await prisma.accessImportJob.update({
    where: { id: jobId },
    data: { status: "completed", metadata: { created } },
  });

  return { created };
}

export async function loadLegacyFileFromDataDir(
  fileName: string
): Promise<string | null> {
  try {
    const full = path.join(process.cwd(), ACCESS_IMPORT_DATA_DIR, fileName);
    return await readFile(full, "utf8");
  } catch {
    return null;
  }
}

export async function bootstrapLegacyImports(actorId: string) {
  const results: { file: string; jobId?: string; error?: string }[] = [];

  const kml = await loadLegacyFileFromDataDir(ACCESS_LEGACY_KML_FILENAME);
  if (kml) {
    const job = await createImportJob({
      createdById: actorId,
      sourceType: "uploaded_kml",
      fileName: ACCESS_LEGACY_KML_FILENAME,
    });
    await parseImportJobContent(job.id, kml, "uploaded_kml");
    results.push({ file: ACCESS_LEGACY_KML_FILENAME, jobId: job.id });
  } else {
    results.push({
      file: ACCESS_LEGACY_KML_FILENAME,
      error: "File not found in data/imports",
    });
  }

  const geo = await loadLegacyFileFromDataDir(ACCESS_LEGACY_GEOJSON_FILENAME);
  if (geo) {
    const job = await createImportJob({
      createdById: actorId,
      sourceType: "geojson_upload",
      fileName: ACCESS_LEGACY_GEOJSON_FILENAME,
    });
    await parseImportJobContent(job.id, geo, "geojson_upload");
    results.push({ file: ACCESS_LEGACY_GEOJSON_FILENAME, jobId: job.id });
  } else {
    results.push({
      file: ACCESS_LEGACY_GEOJSON_FILENAME,
      error: "File not found in data/imports",
    });
  }

  return results;
}
